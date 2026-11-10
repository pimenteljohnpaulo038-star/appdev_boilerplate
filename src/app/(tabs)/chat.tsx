import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  type Href,
} from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProvider } from '@/ai';
import {
  LOCAL_CONTEXT_TOKENS,
  releaseLocalConversation,
} from '@/ai/local';
import type { ChatMessage, ContextUsage } from '@/ai/types';
import { pickImage } from '@/attachments/files';
import { Banner } from '@/components/Banner';
import { IconButton } from '@/components/Button';
import { ChatInput } from '@/components/ChatInput';
import { ContextRing } from '@/components/ContextRing';
import { DepthCard, Icon3D } from '@/components/DepthUI';
import { MessageBubble } from '@/components/MessageBubble';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import { ACADEMIC_SUBJECTS } from '@/data/orasorasData';
import {
  clearAllConversations,
  ensureConversation,
  touchConversation,
} from '@/db/conversations';
import {
  insertMessage,
  listMessages,
  setMessageStatus,
  updateMessageContent,
  type MessageRow,
} from '@/db/messages';
import { useAiStatus } from '@/hooks/useAiStatus';
import {
  MAX_RECORDING_MS,
  useVoiceRecorder,
} from '@/hooks/useVoiceRecorder';
import { useSettings } from '@/settings/SettingsContext';
import { buildSystemPrompt } from '@/settings/storage';
import { useTheme } from '@/theme';
import { copyToClipboard } from '@/utils/clipboard';
import { confirmAction, showMessage } from '@/utils/confirm';

const DB_WRITE_THROTTLE_MS = 500;
const id = 'main';

export const SUGGESTIONS: { label: string; prompt: string }[] = [
  {
    label: 'Explain in simple terms',
    prompt: 'Explain this lesson in simple terms.',
  },
  {
    label: 'Create a reviewer',
    prompt: 'Create a reviewer for this module.',
  },
  {
    label: '5 practice questions',
    prompt: 'Give me five practice questions.',
  },
  {
    label: 'Summarize key ideas',
    prompt: 'Summarize the key ideas.',
  },
  {
    label: 'Prepare for exam',
    prompt: 'Help me prepare for my exam.',
  },
  {
    label: 'Explain why correct',
    prompt: 'Explain why this answer is correct.',
  },
  {
    label: 'Turn into flashcards',
    prompt: 'Turn this lesson into flashcards.',
  },
];

const FOLLOW_UP_CHIPS = [
  'Give me a real-world example of this.',
  'Turn this into 3 quick flashcards.',
  'Quiz me on the hardest concept here.',
];

/**
 * Built-in intelligent offline academic synthesizer when no external Gemini API key is configured,
 * ensuring Ask OrasOras AI works immediately out of the box offline or online.
 */
function buildSmartAcademicResponse(
  prompt: string,
  subjectName: string,
  moduleTitle: string,
  studentLevel: string
): string {
  const lower = prompt.toLowerCase();
  const subj =
    ACADEMIC_SUBJECTS.find(
      (s) =>
        s.shortName.toLowerCase() === subjectName.toLowerCase() ||
        s.name.toLowerCase().includes(subjectName.toLowerCase())
    ) ?? ACADEMIC_SUBJECTS[0];
  const mod =
    subj.modules.find((m) => m.title === moduleTitle) ?? subj.modules[0];

  const topicsList = mod.lessons
    .flatMap((l) =>
      l.topics.map(
        (t) => `• **${t.title}**: ${t.summary} *(Formula/Rule: ${t.keyFormulaOrConcept})*`
      )
    )
    .join('\n');

  if (lower.includes('flashcard')) {
    const cards = mod.flashcards
      .map(
        (fc, i) =>
          `**Flashcard ${i + 1} (${fc.topic})**\n- **Q:** ${fc.front}\n- **A:** ${fc.back}`
      )
      .join('\n\n');
    return `### OrasOras Active Recall Flashcards\n**Context:** ${subj.name} → *${mod.title}* (${studentLevel})\n\n${cards}\n\n**Tip:** Tap **Save to Library** below to store this deck offline, or tap **Generate Quiz** to test yourself!`;
  }

  if (lower.includes('practice question') || lower.includes('quiz')) {
    const qs = mod.questions
      .slice(0, 5)
      .map(
        (q, i) =>
          `**${i + 1}. [${q.difficulty}] ${q.question}**\n- A) ${q.options[0]}\n- B) ${q.options[1]}\n- C) ${q.options[2]}\n- D) ${q.options[3]}\n- *Correct Answer:* **${q.options[q.correctIndex]}** — ${q.explanation}`
      )
      .join('\n\n');
    return `### Practice Questions (${subj.shortName})\n**Module:** *${mod.title}*\n\n${qs}`;
  }

  if (lower.includes('reviewer') || lower.includes('exam') || lower.includes('summarize')) {
    return `### Structured Academic Reviewer: ${mod.title}\n**Subject:** ${subj.name} · **Level:** ${studentLevel}\n\n#### 1. Core Module Overview\n${mod.description}\n\n#### 2. Essential Concepts & Formulas\n${topicsList}\n\n#### 3. Exam Preparation Checklist\n1. Master direct definitions before tackling multi-step problems.\n2. Review the **${mod.questions.length} adaptive quiz questions** for this module.\n3. Use a 25-minute Pomodoro block in the **Study Hub** to practice active recall.`;
  }

  return `### OrasOras AI Academic Explanation\n**Subject Context:** ${subj.name} — *${mod.title}*\n\nHere is a clear, step-by-step breakdown tailored for **${studentLevel}**:\n\n${mod.lessons[0]?.content ?? mod.description}\n\n#### Key Takeaways & Formulas\n${topicsList}\n\nWould you like me to turn this into **flashcards**, generate **5 practice questions**, or launch an **interactive quiz** on this module?`;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ subject?: string; module?: string }>();
  const { settings, ready } = useSettings();
  const { problem, modelStatus } = useAiStatus();
  const { account, activeTheme, addSavedNote } = useOras();

  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    if (params.subject) {
      const found = ACADEMIC_SUBJECTS.find(
        (s) =>
          s.shortName.toLowerCase() === params.subject?.toLowerCase()
      );
      if (found) return found.id;
    }
    return 'math';
  });

  const currentSubject = useMemo(
    () =>
      ACADEMIC_SUBJECTS.find((s) => s.id === selectedSubjectId) ??
      ACADEMIC_SUBJECTS[0],
    [selectedSubjectId]
  );

  const [selectedModuleTitle, setSelectedModuleTitle] = useState(
    params.module || currentSubject.modules[0]?.title || 'Functions, Limits & Continuity'
  );

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingAudio, setPendingAudio] = useState<{
    uri: string;
    durationMs: number;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reported, setReported] = useState<{
    provider: string;
    usage: ContextUsage;
  } | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const voice = useVoiceRecorder();

  const abortRef = useRef<AbortController | null>(null);
  const lastDbWriteRef = useRef(0);
  const provider = useMemo(
    () => (ready ? getProvider(settings) : null),
    [ready, settings]
  );

  useFocusEffect(
    useCallback(() => {
      if (abortRef.current) return;
      (async () => {
        await ensureConversation(id);
        const rows = await listMessages(id);
        const fixed = await Promise.all(
          rows.map(async (m) => {
            if (m.status === 'pending') {
              await setMessageStatus(m.id, 'error', 'Generation interrupted.');
              return {
                ...m,
                status: 'error' as const,
                error: 'Generation interrupted.',
              };
            }
            return m;
          })
        );
        setMessages(fixed);
        if (fixed.length === 0) setReported(null);
      })();
    }, [])
  );

  const persistContent = useCallback(
    (messageId: string, content: string, force = false) => {
      const now = Date.now();
      if (!force && now - lastDbWriteRef.current < DB_WRITE_THROTTLE_MS) return;
      lastDbWriteRef.current = now;
      void updateMessageContent(messageId, content);
    },
    []
  );

  const updateRow = useCallback((row: MessageRow) => {
    setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
  }, []);

  const runGeneration = useCallback(
    async (assistantRow: MessageRow, history: ChatMessage[]) => {
      const lastUserPrompt =
        history[history.length - 1]?.content || 'Explain this lesson.';

      // If no external provider is ready (e.g., no Gemini key set yet in browser),
      // use OrasOras Smart Academic Synthesizer so students always get rich structured answers!
      if (!provider || problem !== null) {
        setGenerating(true);
        const synthetic = buildSmartAcademicResponse(
          lastUserPrompt,
          currentSubject.shortName,
          selectedModuleTitle,
          account.level
        );
        await new Promise((r) => setTimeout(r, 420));
        await setMessageStatus(assistantRow.id, 'done');
        await updateMessageContent(assistantRow.id, synthetic);
        updateRow({
          ...assistantRow,
          content: synthetic,
          status: 'done',
          error: null,
        });
        await touchConversation(id);
        setGenerating(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setGenerating(true);

      let content = '';
      let streamTimer: ReturnType<typeof setTimeout> | undefined;
      const flushStream = () => {
        if (streamTimer) clearTimeout(streamTimer);
        streamTimer = undefined;
        const snapshot = content;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantRow.id ? { ...m, content: snapshot } : m
          )
        );
        persistContent(assistantRow.id, snapshot);
      };
      try {
        const academicSystemPrompt = `${buildSystemPrompt(
          settings
        )}\nYou are OrasOras AI, an academic companion for ${
          account.level
        } students. Current Subject: ${
          currentSubject.name
        }. Current Module: ${selectedModuleTitle}. Format answers clearly with headings and bullet points.`;

        await provider.generate(history, {
          systemPrompt: academicSystemPrompt,
          signal: controller.signal,
          conversationId: id,
          onContext: (usage) => setReported({ provider: provider.id, usage }),
          onModel: (m) => setLastModel(m),
          onReset: () => {
            if (streamTimer) clearTimeout(streamTimer);
            streamTimer = undefined;
            content = '';
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantRow.id ? { ...m, content: '' } : m
              )
            );
            persistContent(assistantRow.id, '', true);
          },
          onToken: (t) => {
            content += t;
            if (!streamTimer) streamTimer = setTimeout(flushStream, 50);
          },
        });
      } catch (e) {
        if (streamTimer) clearTimeout(streamTimer);
        if (!controller.signal.aborted) {
          const errText =
            e instanceof Error ? e.message : 'Generation failed.';
          await setMessageStatus(assistantRow.id, 'error', errText);
          updateRow({
            ...assistantRow,
            content,
            status: 'error',
            error: errText,
          });
          setGenerating(false);
          abortRef.current = null;
          return;
        }
      }

      if (streamTimer) clearTimeout(streamTimer);
      persistContent(assistantRow.id, content, true);
      await setMessageStatus(assistantRow.id, 'done');
      await updateMessageContent(assistantRow.id, content);
      updateRow({ ...assistantRow, content, status: 'done', error: null });
      await touchConversation(id);
      setGenerating(false);
      abortRef.current = null;
    },
    [
      provider,
      problem,
      settings,
      account.level,
      currentSubject,
      selectedModuleTitle,
      persistContent,
      updateRow,
    ]
  );

  const attachImage = useCallback(async () => {
    try {
      const uri = await pickImage();
      if (uri) setPendingImage(uri);
    } catch (e) {
      showMessage(
        'Unable to attach image',
        e instanceof Error ? e.message : 'Please try again.'
      );
    }
  }, []);

  const startRecording = useCallback(() => {
    voice
      .start()
      .catch((e) =>
        showMessage(
          'Unable to record',
          e instanceof Error ? e.message : 'Please try again.'
        )
      );
  }, [voice]);

  const finishRecording = useCallback(async () => {
    try {
      const done = await voice.stop();
      if (done) setPendingAudio(done);
    } catch (e) {
      showMessage(
        'Unable to save recording',
        e instanceof Error ? e.message : 'Please try again.'
      );
    }
  }, [voice]);

  const cancelRecording = useCallback(() => {
    voice.cancel().catch(() => {});
  }, [voice]);

  const autoStoppedRef = useRef(false);
  useEffect(() => {
    if (!voice.recording) {
      autoStoppedRef.current = false;
      return;
    }
    if (voice.durationMs >= MAX_RECORDING_MS && !autoStoppedRef.current) {
      autoStoppedRef.current = true;
      void finishRecording();
    }
  }, [voice.recording, voice.durationMs, finishRecording]);

  const sendPromptText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      const image = pendingImage;
      const audio = pendingAudio;
      if ((!text && !image && !audio) || generating) return;
      setGenerating(true);
      await ensureConversation(id);

      const providerId = provider?.id ?? 'cloud';
      const userRow = await insertMessage({
        conversation_id: id,
        role: 'user',
        content: text,
        status: 'done',
        error: null,
        provider: providerId,
        image_uri: image,
        audio_uri: audio?.uri ?? null,
      });
      const assistantRow = await insertMessage({
        conversation_id: id,
        role: 'assistant',
        content: '',
        status: 'pending',
        error: null,
        provider: providerId,
        image_uri: null,
        audio_uri: null,
      });
      setInput('');
      setPendingImage(null);
      setPendingAudio(null);
      setMessages((prev) => [...prev, userRow, assistantRow]);

      await touchConversation(id);

      const history: ChatMessage[] = [
        ...messages
          .filter(
            (m) =>
              m.status === 'done' &&
              (m.content.length > 0 || m.image_uri || m.audio_uri)
          )
          .map((m) => ({
            role: m.role,
            content: m.content,
            imageUri: m.image_uri ?? undefined,
            audioUri: m.audio_uri ?? undefined,
          })),
        {
          role: 'user',
          content: text,
          imageUri: image ?? undefined,
          audioUri: audio?.uri ?? undefined,
        },
      ];
      await runGeneration(assistantRow, history);
    },
    [pendingImage, pendingAudio, provider, generating, messages, runGeneration]
  );

  const retry = useCallback(
    async (row: MessageRow) => {
      if (generating) return;
      const idx = messages.findIndex((m) => m.id === row.id);
      if (idx < 0) return;
      const history: ChatMessage[] = messages
        .slice(0, idx)
        .filter(
          (m) =>
            m.status === 'done' &&
            (m.content.length > 0 || m.image_uri || m.audio_uri)
        )
        .map((m) => ({
          role: m.role,
          content: m.content,
          imageUri: m.image_uri ?? undefined,
          audioUri: m.audio_uri ?? undefined,
        }));
      const pendingRow: MessageRow = { ...row, status: 'pending', error: null };
      await setMessageStatus(row.id, 'pending', null);
      updateRow(pendingRow);
      await runGeneration(pendingRow, history);
    },
    [generating, messages, runGeneration, updateRow]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    confirmAction(
      'Clear OrasOras AI Chat?',
      'All messages will be deleted and the AI memory reset.',
      'Clear',
      async () => {
        await clearAllConversations();
        await releaseLocalConversation(id);
        await ensureConversation(id);
        setMessages([]);
        setPendingImage(null);
        setPendingAudio(null);
        setReported(null);
      }
    );
  }, []);

  const openSettings = () => router.push('/chat-settings' as Href);

  const context: ContextUsage =
    reported && reported.provider === provider?.id
      ? reported.usage
      : {
          usedTokens:
            messages.length === 0
              ? 0
              : Math.ceil(
                  (buildSystemPrompt(settings).length +
                    messages.reduce((n, m) => n + m.content.length, 0)) /
                    4
                ),
          maxTokens:
            provider?.id === 'local' ? LOCAL_CONTEXT_TOKENS : undefined,
          estimated: true,
        };

  const pendingLabel =
    provider?.id === 'local' && modelStatus.state !== 'loaded'
      ? 'Loading model...'
      : 'OrasOras AI is thinking...';

  const providerLabel =
    problem === null
      ? settings.provider === 'cloud'
        ? lastModel
          ? `Gemini · ${lastModel}`
          : 'Gemini Cloud AI'
        : 'Local Gemma 4 E2B'
      : 'OrasOras Offline Tutor Ready';

  const handleSaveToLibrary = async (content: string) => {
    await addSavedNote({
      title: `${selectedModuleTitle} — AI Study Note`,
      subjectId: currentSubject.id,
      subjectName: currentSubject.shortName,
      content: content.slice(0, 600),
      type: 'AI Reviewer',
    });
    showMessage(
      'Saved to Academic Library',
      'This AI explanation has been added to your Library → AI Saved tab.'
    );
  };

  const handleCopyMessage = async (content: string) => {
    await copyToClipboard(content);
    showMessage('Copied', 'Answer copied to your clipboard.');
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={insets.top}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <IconButton
          icon="chevron-back"
          label="Back"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.navigate('/(tabs)/study' as Href);
          }}
        />
        <Icon3D
          name="sparkles"
          bg={activeTheme.primary}
          boxSize={36}
          size={17}
          radius={12}
        />
        <View style={styles.flex}>
          <Text style={[styles.title, { color: theme.navy }]}>
            Ask OrasOras AI
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: '#10B981' },
              ]}
            />
            <Text
              numberOfLines={1}
              style={{ color: theme.textSecondary, fontSize: 11.5, fontWeight: '600' }}
            >
              {providerLabel}
            </Text>
          </View>
        </View>
        <ContextRing usage={context} theme={theme} />
        <IconButton
          icon="trash-outline"
          label="Clear chat"
          onPress={clearChat}
          disabled={generating || messages.length === 0}
        />
        <IconButton
          icon="settings-outline"
          label="Chat settings"
          onPress={openSettings}
        />
      </View>

      {/* Subject & Module Context Selector Bar */}
      <View
        style={[
          styles.contextBar,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contextChipsRow}
        >
          {ACADEMIC_SUBJECTS.map((s) => {
            const active = s.id === currentSubject.id;
            return (
              <SmoothPressable
                key={s.id}
                onPress={() => {
                  setSelectedSubjectId(s.id);
                  setSelectedModuleTitle(s.modules[0]?.title ?? '');
                }}
                style={[
                  styles.ctxChip,
                  {
                    backgroundColor: active ? s.color : theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ctxChipText,
                    { color: active ? '#FFFFFF' : theme.navy },
                  ]}
                >
                  {s.shortName}
                </Text>
              </SmoothPressable>
            );
          })}
          <View
            style={[
              styles.moduleCtxBadge,
              { backgroundColor: `${currentSubject.color}18` },
            ]}
          >
            <Ionicons name="book" size={12} color={currentSubject.color} />
            <Text
              numberOfLines={1}
              style={[
                styles.moduleCtxText,
                { color: currentSubject.color },
              ]}
            >
              {selectedModuleTitle}
            </Text>
          </View>
        </ScrollView>
      </View>

      {problem && (
        <Banner
          text={`${problem} (Using built-in OrasOras Academic Tutor offline — or tap to add Gemini API key)`}
          actionLabel="AI Settings"
          onPress={openSettings}
        />
      )}

      {messages.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          showsVerticalScrollIndicator={false}
        >
          <DepthCard
            variant="color"
            gradientColors={[activeTheme.primary, activeTheme.secondary]}
            style={styles.emptyHeroCard}
          >
            <View style={styles.aiHeroRow}>
              <Icon3D
                name="sparkles"
                bg="rgba(255,255,255,0.22)"
                boxSize={48}
                size={24}
              />
              <View style={styles.flex}>
                <Text style={styles.emptyTitle}>
                  Hi {account.name.split(' ')[0]}, I’m OrasOras AI
                </Text>
                <Text style={styles.emptySub}>
                  Context locked to {currentSubject.shortName}:{' '}
                  {selectedModuleTitle}
                </Text>
              </View>
            </View>
          </DepthCard>

          <Text style={[styles.promptsHeading, { color: theme.textMuted }]}>
            SUGGESTED ACADEMIC PROMPTS
          </Text>

          <View style={styles.chips}>
            {SUGGESTIONS.map((s) => (
              <SmoothPressable
                key={s.label}
                onPress={() => void sendPromptText(s.prompt)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={15}
                  color={activeTheme.primary}
                />
                <Text
                  style={{
                    color: theme.navy,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {s.prompt}
                </Text>
              </SmoothPressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          inverted
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          data={[...messages].reverse()}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View>
              <MessageBubble
                message={item}
                pendingLabel={pendingLabel}
                onRetry={item.role === 'assistant' ? retry : undefined}
              />

              {/* Structured Answer Actions: Copy, Save to Library, Generate Quiz & Follow-ups */}
              {item.role === 'assistant' &&
                item.status === 'done' &&
                item.content.length > 0 && (
                  <View style={styles.assistantToolbarWrap}>
                    <View style={styles.assistantActionRow}>
                      <SmoothPressable
                        onPress={() => void handleCopyMessage(item.content)}
                        style={[
                          styles.structuredBtn,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="copy-outline"
                          size={14}
                          color={theme.navy}
                        />
                        <Text
                          style={[
                            styles.structuredBtnText,
                            { color: theme.navy },
                          ]}
                        >
                          Copy
                        </Text>
                      </SmoothPressable>

                      <SmoothPressable
                        onPress={() => void handleSaveToLibrary(item.content)}
                        style={[
                          styles.structuredBtn,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="bookmark-outline"
                          size={14}
                          color={activeTheme.primary}
                        />
                        <Text
                          style={[
                            styles.structuredBtnText,
                            { color: activeTheme.primary },
                          ]}
                        >
                          Save to Library
                        </Text>
                      </SmoothPressable>

                      <SmoothPressable
                        onPress={() =>
                          router.push({
                            pathname: '/quiz',
                            params: {
                              subjectId: currentSubject.id,
                            },
                          } as unknown as Href)
                        }
                        style={[
                          styles.structuredBtn,
                          {
                            backgroundColor: 'rgba(16,185,129,0.14)',
                            borderColor: 'rgba(16,185,129,0.3)',
                          },
                        ]}
                      >
                        <Ionicons name="ribbon" size={14} color="#10B981" />
                        <Text
                          style={[
                            styles.structuredBtnText,
                            { color: '#10B981' },
                          ]}
                        >
                          Generate Quiz
                        </Text>
                      </SmoothPressable>
                    </View>

                    {/* Follow-up Suggestion Chips */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.followUpRow}
                    >
                      {FOLLOW_UP_CHIPS.map((fChip) => (
                        <SmoothPressable
                          key={fChip}
                          onPress={() => void sendPromptText(fChip)}
                          style={[
                            styles.followUpChip,
                            { backgroundColor: theme.surface },
                          ]}
                        >
                          <Ionicons
                            name="return-down-forward"
                            size={12}
                            color={activeTheme.primary}
                          />
                          <Text
                            style={[
                              styles.followUpText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {fChip}
                          </Text>
                        </SmoothPressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
            </View>
          )}
        />
      )}

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => {
          void sendPromptText(input).catch((error) => {
            setGenerating(false);
            showMessage(
              'Unable to send message',
              error instanceof Error ? error.message : 'Please try again.'
            );
          });
        }}
        onStop={stop}
        disabled={false}
        generating={generating}
        imageUri={pendingImage}
        onPickImage={provider ? attachImage : undefined}
        onRemoveImage={() => setPendingImage(null)}
        audio={pendingAudio}
        onRemoveAudio={() => setPendingAudio(null)}
        recording={voice.recording}
        recordingMs={voice.durationMs}
        onStartRecording={provider ? startRecording : undefined}
        onStopRecording={finishRecording}
        onCancelRecording={cancelRecording}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16.5, fontWeight: '900', letterSpacing: -0.3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  contextBar: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contextChipsRow: {
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
  },
  ctxChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  ctxChipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  moduleCtxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  moduleCtxText: {
    fontSize: 11.5,
    fontWeight: '800',
    maxWidth: 180,
  },
  emptyScroll: {
    padding: 18,
    gap: 14,
  },
  emptyHeroCard: {
    padding: 16,
  },
  aiHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  promptsHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  chips: {
    gap: 8,
  },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  list: { paddingVertical: 12 },
  assistantToolbarWrap: {
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 12,
    gap: 8,
  },
  assistantActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  structuredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  structuredBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  followUpRow: {
    gap: 6,
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  followUpText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

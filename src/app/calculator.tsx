import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DepthCard } from '@/components/DepthUI';
import { SmoothPressable } from '@/components/SmoothPressable';
import { useOras } from '@/context/OrasContext';
import { useTheme } from '@/theme';
import { evaluateExpression } from '@/utils/calculator';
import { copyToClipboard } from '@/utils/clipboard';
import { confirmAction, showMessage } from '@/utils/confirm';

type StudyToolTab =
  | 'calculator'
  | 'stopwatch'
  | 'timer'
  | 'converter'
  | 'notes'
  | 'todo';

interface ToolTabConfig {
  id: StudyToolTab;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

const TOOLS: ToolTabConfig[] = [
  { id: 'calculator', label: 'Calculator', icon: 'calculator', color: '#06B6D4' },
  { id: 'stopwatch', label: 'Stopwatch', icon: 'stopwatch', color: '#3B82F6' },
  { id: 'timer', label: 'Timer', icon: 'timer', color: '#F59E0B' },
  { id: 'converter', label: 'Converter', icon: 'swap-horizontal', color: '#10B981' },
  { id: 'notes', label: 'Notes', icon: 'create', color: '#8B5CF6' },
  { id: 'todo', label: 'To-Do', icon: 'checkbox', color: '#EC4899' },
];

// Unit Converter Definitions
type UnitCategory = 'Length' | 'Mass' | 'Temperature' | 'Data' | 'Time';

interface UnitDef {
  label: string;
  factorToBase: number; // For Length: base is meter, Mass: base is gram, Data: base is byte, Time: base is sec
}

const CONVERTER_DATA: Record<UnitCategory, Record<string, UnitDef>> = {
  Length: {
    Meter: { label: 'Meters (m)', factorToBase: 1 },
    Kilometer: { label: 'Kilometers (km)', factorToBase: 1000 },
    Centimeter: { label: 'Centimeters (cm)', factorToBase: 0.01 },
    Millimeter: { label: 'Millimeters (mm)', factorToBase: 0.001 },
    Foot: { label: 'Feet (ft)', factorToBase: 0.3048 },
    Inch: { label: 'Inches (in)', factorToBase: 0.0254 },
    Mile: { label: 'Miles (mi)', factorToBase: 1609.344 },
  },
  Mass: {
    Kilogram: { label: 'Kilograms (kg)', factorToBase: 1000 },
    Gram: { label: 'Grams (g)', factorToBase: 1 },
    Milligram: { label: 'Milligrams (mg)', factorToBase: 0.001 },
    Pound: { label: 'Pounds (lb)', factorToBase: 453.59237 },
    Ounce: { label: 'Ounces (oz)', factorToBase: 28.34952 },
  },
  Data: {
    Byte: { label: 'Bytes (B)', factorToBase: 1 },
    Kilobyte: { label: 'Kilobytes (KB)', factorToBase: 1024 },
    Megabyte: { label: 'Megabytes (MB)', factorToBase: 1048576 },
    Gigabyte: { label: 'Gigabytes (GB)', factorToBase: 1073741824 },
    Terabyte: { label: 'Terabytes (TB)', factorToBase: 1099511627776 },
  },
  Time: {
    Second: { label: 'Seconds (s)', factorToBase: 1 },
    Minute: { label: 'Minutes (min)', factorToBase: 60 },
    Hour: { label: 'Hours (hr)', factorToBase: 3600 },
    Day: { label: 'Days (d)', factorToBase: 86400 },
  },
  Temperature: {
    Celsius: { label: 'Celsius (°C)', factorToBase: 1 },
    Fahrenheit: { label: 'Fahrenheit (°F)', factorToBase: 1 },
    Kelvin: { label: 'Kelvin (K)', factorToBase: 1 },
  },
};

export default function StudyToolsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tool?: string }>();
  const { account, activeTheme, addSavedNote, deleteSavedNote, t } = useOras();

  const toolsList: ToolTabConfig[] = useMemo(
    () => [
      { id: 'calculator', label: t.calculatorTab, icon: 'calculator', color: '#06B6D4' },
      { id: 'stopwatch', label: t.stopwatchTab, icon: 'stopwatch', color: '#3B82F6' },
      { id: 'timer', label: t.timerTab, icon: 'timer', color: '#F59E0B' },
      { id: 'converter', label: t.converterTab, icon: 'swap-horizontal', color: '#10B981' },
      { id: 'notes', label: t.notesTab, icon: 'create', color: '#8B5CF6' },
      { id: 'todo', label: 'To-Do', icon: 'checkbox', color: '#EC4899' },
    ],
    [t]
  );

  // Active Tool state
  const initialTool: StudyToolTab = (
    params.tool && TOOLS.some((t) => t.id === params.tool)
      ? params.tool
      : 'calculator'
  ) as StudyToolTab;

  const [activeTool, setActiveTool] = useState<StudyToolTab>(initialTool);
  const [prevToolParam, setPrevToolParam] = useState(params.tool);

  if (params.tool && params.tool !== prevToolParam) {
    setPrevToolParam(params.tool);
    if (TOOLS.some((t) => t.id === params.tool)) {
      setActiveTool(params.tool as StudyToolTab);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CALCULATOR STATE & LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  const [calcMode, setCalcMode] = useState<'basic' | 'scientific'>('basic');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [calcHistory, setCalcHistory] = useState<{ expr: string; res: string }[]>([
    { expr: '25 × 4 + 15', res: '115' },
    { expr: 'sin(30) + cos(60)', res: '1' },
  ]);

  const handleCalcInput = (val: string) => {
    setError(null);
    let nextExpr = expression;

    if (val === 'sin' || val === 'cos' || val === 'tan' || val === 'log' || val === 'ln' || val === 'sqrt') {
      nextExpr = expression + val + '(';
      setExpression(nextExpr);
      return;
    }

    if (val === 'π') {
      nextExpr = expression + 'π';
      setExpression(nextExpr);
      return;
    }

    if (['+', '-', '×', '÷', '^'].includes(val)) {
      if (!expression) {
        if (val === '-') {
          setExpression('-');
        } else if (result && !isNaN(Number(result.replace(/,/g, '')))) {
          setExpression(result.replace(/,/g, '') + val);
        }
        return;
      }
      const lastChar = expression.slice(-1);
      if (['+', '-', '×', '÷', '^'].includes(lastChar)) {
        setExpression(expression.slice(0, -1) + val);
        return;
      }
    }

    if (val === '.') {
      const parts = expression.split(/[+\-×÷^()]/);
      const currentSegment = parts[parts.length - 1];
      if (currentSegment.includes('.')) return;
      if (!currentSegment) {
        setExpression(expression + '0.');
        return;
      }
    }

    nextExpr = expression + val;
    setExpression(nextExpr);

    if (/[0-9)π]/.test(val)) {
      const live = evaluateExpression(nextExpr, { angleMode });
      if (live.formatted && !live.error) {
        setResult(live.formatted);
      }
    }
  };

  const handleCalcClear = () => {
    setExpression('');
    setResult('');
    setError(null);
  };

  const handleCalcDelete = () => {
    setError(null);
    if (!expression) return;
    const nextExpr = expression.slice(0, -1);
    setExpression(nextExpr);
    if (nextExpr.length > 0 && /[0-9)π]/.test(nextExpr.slice(-1))) {
      const live = evaluateExpression(nextExpr, { angleMode });
      if (live.formatted && !live.error) {
        setResult(live.formatted);
      } else {
        setResult('');
      }
    } else {
      setResult('');
    }
  };

  const handleCalcEqual = () => {
    if (!expression) return;
    const evalResult = evaluateExpression(expression, { angleMode });
    if (evalResult.error) {
      setError(evalResult.error);
    } else if (evalResult.formatted !== undefined) {
      const formatted = evalResult.formatted;
      setCalcHistory((prev) => [{ expr: expression, res: formatted }, ...prev.slice(0, 4)]);
      setExpression(formatted.replace(/,/g, ''));
      setResult('');
      setError(null);
    }
  };

  const handleToggleSign = () => {
    if (!expression) return;
    if (expression.startsWith('-')) {
      setExpression(expression.slice(1));
    } else {
      setExpression('-' + expression);
    }
  };

  const handleCopyResult = async () => {
    const textToCopy = result || expression;
    if (!textToCopy) return;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard shortcut support on Web for calculator
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (activeTool !== 'calculator') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= '0' && e.key <= '9') {
        handleCalcInput(e.key);
      } else if (e.key === '.') {
        handleCalcInput('.');
      } else if (e.key === '+') {
        handleCalcInput('+');
      } else if (e.key === '-') {
        handleCalcInput('-');
      } else if (e.key === '*') {
        handleCalcInput('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleCalcInput('÷');
      } else if (e.key === '^') {
        handleCalcInput('^');
      } else if (e.key === '(' || e.key === ')') {
        handleCalcInput(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalcEqual();
      } else if (e.key === 'Backspace') {
        handleCalcDelete();
      } else if (e.key === 'Escape') {
        handleCalcClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. STOPWATCH STATE & LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  const [stopwatchTime, setStopwatchTime] = useState(0); // milliseconds
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<{ id: number; splitTime: number; overallTime: number }[]>([]);
  const stopwatchStartRef = useRef(0);

  const handleToggleStopwatch = () => {
    if (!stopwatchRunning) {
      stopwatchStartRef.current = Date.now() - stopwatchTime;
      setStopwatchRunning(true);
    } else {
      setStopwatchRunning(false);
    }
  };

  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(() => {
      setStopwatchTime(Date.now() - stopwatchStartRef.current);
    }, 30);
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  const handleStopwatchLap = () => {
    const lastLapOverall = laps.length > 0 ? laps[0].overallTime : 0;
    const split = stopwatchTime - lastLapOverall;
    setLaps((prev) => [{ id: prev.length + 1, splitTime: split, overallTime: stopwatchTime }, ...prev]);
  };

  const handleStopwatchReset = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. COUNTDOWN TIMER STATE & LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  const TIMER_PRESETS = [
    { label: '5m', sec: 5 * 60, title: 'Speed Drill' },
    { label: '10m', sec: 10 * 60, title: 'Quiz Prep' },
    { label: '15m', sec: 15 * 60, title: 'Active Recall' },
    { label: '25m', sec: 25 * 60, title: 'Pomodoro' },
    { label: '45m', sec: 45 * 60, title: 'Deep Work' },
  ];

  const [timerInitialSec, setTimerInitialSec] = useState(25 * 60);
  const [timerRemainingSec, setTimerRemainingSec] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimerRemainingSec((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          showMessage('Timer Finished! ⏰', 'Your study countdown session is complete.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleSelectTimerPreset = (sec: number) => {
    setTimerActive(false);
    setTimerInitialSec(sec);
    setTimerRemainingSec(sec);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerRemainingSec(timerInitialSec);
  };

  const timerMin = String(Math.floor(timerRemainingSec / 60)).padStart(2, '0');
  const timerSec = String(timerRemainingSec % 60).padStart(2, '0');
  const timerProgress = 1 - timerRemainingSec / Math.max(1, timerInitialSec);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. UNIT CONVERTER STATE & LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  const [convCategory, setConvCategory] = useState<UnitCategory>('Length');
  const [convFromUnit, setConvFromUnit] = useState<string>('Meter');
  const [convToUnit, setConvToUnit] = useState<string>('Centimeter');
  const [convFromValue, setConvFromValue] = useState<string>('1');

  const convertedValue = useMemo(() => {
    const val = parseFloat(convFromValue);
    if (isNaN(val)) return '—';

    if (convCategory === 'Temperature') {
      let celsius = val;
      if (convFromUnit === 'Fahrenheit') {
        celsius = ((val - 32) * 5) / 9;
      } else if (convFromUnit === 'Kelvin') {
        celsius = val - 273.15;
      }

      let res = celsius;
      if (convToUnit === 'Fahrenheit') {
        res = (celsius * 9) / 5 + 32;
      } else if (convToUnit === 'Kelvin') {
        res = celsius + 273.15;
      }
      return (Math.round(res * 1e4) / 1e4).toLocaleString('en-US');
    }

    const catData = CONVERTER_DATA[convCategory];
    const fromDef = catData[convFromUnit];
    const toDef = catData[convToUnit];
    if (!fromDef || !toDef) return '—';

    const baseVal = val * fromDef.factorToBase;
    const res = baseVal / toDef.factorToBase;
    return (Math.round(res * 1e6) / 1e6).toLocaleString('en-US');
  }, [convCategory, convFromUnit, convToUnit, convFromValue]);

  const handleSwapUnits = () => {
    setConvFromUnit(convToUnit);
    setConvToUnit(convFromUnit);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. DIGITAL QUICK NOTES STATE & LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notesFilter, setNotesFilter] = useState('');

  const handleSaveQuickNote = async () => {
    if (!noteContent.trim()) {
      showMessage('Empty Note', 'Write some notes before saving.');
      return;
    }
    const title = noteTitle.trim() || `Study Note · ${new Date().toLocaleDateString('en-US')}`;
    await addSavedNote({
      title,
      subjectId: 'general',
      subjectName: 'Study Tools',
      content: noteContent.trim(),
      type: 'Quick Note',
    });
    setNoteTitle('');
    setNoteContent('');
    showMessage('Saved to Library', `"${title}" has been saved locally.`);
  };

  const handleCopyNote = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) showMessage('Copied', 'Note content copied to clipboard.');
  };

  const handleDeleteSavedNote = (id: string, title: string) => {
    confirmAction(
      'Delete Note?',
      `Are you sure you want to delete "${title}"?`,
      'Delete',
      () => void deleteSavedNote(id)
    );
  };

  const filteredNotes = account.savedNotes.filter((n) =>
    !notesFilter || n.title.toLowerCase().includes(notesFilter.toLowerCase()) || n.content.toLowerCase().includes(notesFilter.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PERSONAL TO-DO LIST STATE & LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  interface PersonalTodo {
    id: string;
    text: string;
    done: boolean;
    createdAt: string;
  }

  const [todoInput, setTodoInput] = useState('');
  const [todoFilter, setTodoFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([
    { id: '1', text: 'Review Calculus derivatives worksheet', done: false, createdAt: 'Today' },
    { id: '2', text: 'Summarize Science Cell Structure module', done: true, createdAt: 'Today' },
    { id: '3', text: 'Practice 15 flashcards before dinner', done: false, createdAt: 'Today' },
  ]);

  const handleAddTodo = () => {
    if (!todoInput.trim()) return;
    const newTodo: PersonalTodo = {
      id: 'todo_' + Date.now(),
      text: todoInput.trim(),
      done: false,
      createdAt: 'Today',
    };
    setPersonalTodos((prev) => [newTodo, ...prev]);
    setTodoInput('');
  };

  const handleToggleTodo = (id: string) => {
    setPersonalTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleDeleteTodo = (id: string) => {
    setPersonalTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompletedTodos = () => {
    setPersonalTodos((prev) => prev.filter((t) => !t.done));
  };

  const filteredTodos = personalTodos.filter((t) => {
    if (todoFilter === 'pending') return !t.done;
    if (todoFilter === 'completed') return t.done;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <SmoothPressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)');
          }}
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={theme.navy} />
        </SmoothPressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.navy }]}>{t.toolsTitle}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Academic utilities for daily focus & calculations
          </Text>
        </View>
      </View>

      {/* Tool Selector Tab Bar */}
      <View style={styles.tabScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {toolsList.map((tool) => {
            const active = activeTool === tool.id;
            return (
              <SmoothPressable
                key={tool.id}
                onPress={() => setActiveTool(tool.id)}
                style={[
                  styles.toolTabPill,
                  {
                    backgroundColor: active ? tool.color : theme.card,
                    borderColor: active ? tool.color : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={tool.icon}
                  size={16}
                  color={active ? '#FFFFFF' : tool.color}
                />
                <Text
                  style={[
                    styles.toolTabLabel,
                    { color: active ? '#FFFFFF' : theme.navy },
                  ]}
                >
                  {tool.label}
                </Text>
              </SmoothPressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.mainScrollContent,
          { maxWidth: 640, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================================== */}
        {/* TOOL 1: CALCULATOR                                                  */}
        {/* =================================================================== */}
        {activeTool === 'calculator' && (
          <View style={styles.toolSection}>
            {/* Mode & Angle Switcher Row */}
            <View style={styles.calcSubHeader}>
              <View style={styles.calcTogglePillGroup}>
                <SmoothPressable
                  onPress={() => setCalcMode('basic')}
                  style={[
                    styles.calcToggleBtn,
                    calcMode === 'basic' && { backgroundColor: activeTheme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.calcToggleText,
                      { color: calcMode === 'basic' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Basic
                  </Text>
                </SmoothPressable>
                <SmoothPressable
                  onPress={() => setCalcMode('scientific')}
                  style={[
                    styles.calcToggleBtn,
                    calcMode === 'scientific' && { backgroundColor: activeTheme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.calcToggleText,
                      { color: calcMode === 'scientific' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Scientific
                  </Text>
                </SmoothPressable>
              </View>

              {calcMode === 'scientific' && (
                <SmoothPressable
                  onPress={() => setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg'))}
                  style={[styles.angleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={[styles.angleBtnText, { color: activeTheme.primary }]}>
                    {angleMode.toUpperCase()}
                  </Text>
                </SmoothPressable>
              )}
            </View>

            {/* Display Card */}
            <DepthCard variant="card" style={styles.displayCard}>
              <View style={styles.displayTopRow}>
                <Text style={[styles.displayHint, { color: theme.textSecondary }]}>
                  {calcMode === 'scientific' ? `Scientific (${angleMode.toUpperCase()})` : 'Expression'}
                </Text>
                {(result || expression) ? (
                  <SmoothPressable onPress={handleCopyResult} style={styles.copyBtn}>
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={14}
                      color={copied ? '#10B981' : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.copyBtnText,
                        { color: copied ? '#10B981' : theme.textSecondary },
                      ]}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </SmoothPressable>
                ) : null}
              </View>

              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                style={[styles.expressionText, { color: theme.textSecondary }]}
              >
                {expression || '0'}
              </Text>

              {error ? (
                <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
              ) : (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.resultText, { color: theme.navy }]}
                >
                  {result ? `= ${result}` : ''}
                </Text>
              )}
            </DepthCard>

            {/* Scientific Function Strip */}
            {calcMode === 'scientific' && (
              <View style={styles.sciGrid}>
                {[
                  { label: 'sin', action: () => handleCalcInput('sin') },
                  { label: 'cos', action: () => handleCalcInput('cos') },
                  { label: 'tan', action: () => handleCalcInput('tan') },
                  { label: 'log', action: () => handleCalcInput('log') },
                  { label: 'ln', action: () => handleCalcInput('ln') },
                  { label: '√', action: () => handleCalcInput('sqrt') },
                  { label: '^', action: () => handleCalcInput('^') },
                  { label: 'π', action: () => handleCalcInput('π') },
                  { label: '(', action: () => handleCalcInput('(') },
                  { label: ')', action: () => handleCalcInput(')') },
                ].map((s) => (
                  <SmoothPressable
                    key={s.label}
                    onPress={s.action}
                    style={[styles.sciBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <Text style={[styles.sciBtnText, { color: activeTheme.primary }]}>{s.label}</Text>
                  </SmoothPressable>
                ))}
              </View>
            )}

            {/* Main Keypad */}
            <View style={styles.keypad}>
              {[
                [
                  { label: 'C', type: 'func', action: handleCalcClear },
                  { label: '±', type: 'func', action: handleToggleSign },
                  { label: 'DEL', type: 'func', action: handleCalcDelete },
                  { label: '÷', type: 'op', action: () => handleCalcInput('÷') },
                ],
                [
                  { label: '7', type: 'num', action: () => handleCalcInput('7') },
                  { label: '8', type: 'num', action: () => handleCalcInput('8') },
                  { label: '9', type: 'num', action: () => handleCalcInput('9') },
                  { label: '×', type: 'op', action: () => handleCalcInput('×') },
                ],
                [
                  { label: '4', type: 'num', action: () => handleCalcInput('4') },
                  { label: '5', type: 'num', action: () => handleCalcInput('5') },
                  { label: '6', type: 'num', action: () => handleCalcInput('6') },
                  { label: '-', type: 'op', action: () => handleCalcInput('-') },
                ],
                [
                  { label: '1', type: 'num', action: () => handleCalcInput('1') },
                  { label: '2', type: 'num', action: () => handleCalcInput('2') },
                  { label: '3', type: 'num', action: () => handleCalcInput('3') },
                  { label: '+', type: 'op', action: () => handleCalcInput('+') },
                ],
                [
                  { label: '0', type: 'num', action: () => handleCalcInput('0'), flex: 2 },
                  { label: '.', type: 'num', action: () => handleCalcInput('.') },
                  { label: '=', type: 'equal', action: handleCalcEqual },
                ],
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map((btn) => {
                    const isOp = btn.type === 'op';
                    const isEqual = btn.type === 'equal';
                    const isFunc = btn.type === 'func';

                    let bg = theme.card;
                    let txt = theme.navy;
                    let border = theme.border;

                    if (isEqual) {
                      bg = activeTheme.primary;
                      txt = '#FFFFFF';
                      border = activeTheme.primary;
                    } else if (isOp) {
                      bg = `${activeTheme.primary}18`;
                      txt = activeTheme.primary;
                      border = `${activeTheme.primary}35`;
                    } else if (isFunc) {
                      bg = theme.surface;
                      txt = theme.textSecondary;
                    }

                    return (
                      <SmoothPressable
                        key={btn.label}
                        onPress={btn.action}
                        style={[
                          styles.keyBtn,
                          { flex: btn.flex || 1, backgroundColor: bg, borderColor: border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.keyLabel,
                            { color: txt, fontWeight: isOp || isEqual ? '800' : '700' },
                          ]}
                        >
                          {btn.label}
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Recent History */}
            {calcHistory.length > 0 && (
              <View style={styles.historyBlock}>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                  RECENT CALCULATIONS
                </Text>
                <View style={styles.historyList}>
                  {calcHistory.map((h, i) => (
                    <SmoothPressable
                      key={i}
                      onPress={() => {
                        setExpression(h.expr);
                        setResult(h.res);
                      }}
                      style={[styles.historyRow, { borderBottomColor: theme.border }]}
                    >
                      <Text style={[styles.historyExpr, { color: theme.textSecondary }]}>{h.expr}</Text>
                      <Text style={[styles.historyRes, { color: activeTheme.primary }]}>= {h.res}</Text>
                    </SmoothPressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* =================================================================== */}
        {/* TOOL 2: STOPWATCH                                                   */}
        {/* =================================================================== */}
        {activeTool === 'stopwatch' && (
          <View style={styles.toolSection}>
            <DepthCard variant="card" style={styles.stopwatchCard}>
              <Text style={[styles.stopwatchDisplay, { color: theme.navy }]}>
                {formatStopwatch(stopwatchTime)}
              </Text>
              <Text style={[styles.stopwatchStatus, { color: theme.textMuted }]}>
                {stopwatchRunning ? 'STOPWATCH RUNNING' : stopwatchTime > 0 ? 'PAUSED' : 'READY TO RECORD'}
              </Text>

              {/* Controls */}
              <View style={styles.toolControlsRow}>
                <SmoothPressable
                  onPress={handleToggleStopwatch}
                  style={[
                    styles.primaryToolBtn,
                    { backgroundColor: stopwatchRunning ? '#F59E0B' : '#3B82F6' },
                  ]}
                >
                  <Ionicons name={stopwatchRunning ? 'pause' : 'play'} size={20} color="#FFFFFF" />
                  <Text style={styles.primaryToolBtnText}>
                    {stopwatchRunning ? 'Pause' : 'Start'}
                  </Text>
                </SmoothPressable>

                {stopwatchRunning && (
                  <SmoothPressable
                    onPress={handleStopwatchLap}
                    style={[styles.secondaryToolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <Ionicons name="flag-outline" size={18} color={theme.navy} />
                    <Text style={[styles.secondaryToolBtnText, { color: theme.navy }]}>Lap</Text>
                  </SmoothPressable>
                )}

                <SmoothPressable
                  onPress={handleStopwatchReset}
                  style={[styles.secondaryToolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Ionicons name="refresh" size={18} color={theme.navy} />
                  <Text style={[styles.secondaryToolBtnText, { color: theme.navy }]}>Reset</Text>
                </SmoothPressable>
              </View>
            </DepthCard>

            {/* Lap Times List */}
            {laps.length > 0 && (
              <View style={styles.lapsBlock}>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                  RECORDED LAPS ({laps.length})
                </Text>
                <DepthCard variant="mini" style={{ gap: 8 }}>
                  {laps.map((lap) => (
                    <View key={lap.id} style={[styles.lapRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.lapIndex, { color: activeTheme.primary }]}>Lap {lap.id}</Text>
                      <Text style={[styles.lapSplit, { color: theme.navy }]}>+{formatStopwatch(lap.splitTime)}</Text>
                      <Text style={[styles.lapOverall, { color: theme.textMuted }]}>{formatStopwatch(lap.overallTime)}</Text>
                    </View>
                  ))}
                </DepthCard>
              </View>
            )}
          </View>
        )}

        {/* =================================================================== */}
        {/* TOOL 3: COUNTDOWN TIMER                                             */}
        {/* =================================================================== */}
        {activeTool === 'timer' && (
          <View style={styles.toolSection}>
            {/* Presets */}
            <View style={styles.presetRow}>
              {TIMER_PRESETS.map((p) => {
                const selected = timerInitialSec === p.sec;
                return (
                  <SmoothPressable
                    key={p.label}
                    onPress={() => handleSelectTimerPreset(p.sec)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: selected ? '#F59E0B' : theme.card,
                        borderColor: selected ? '#F59E0B' : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.presetChipLabel, { color: selected ? '#FFFFFF' : theme.navy }]}>
                      {p.label}
                    </Text>
                    <Text style={[styles.presetChipSub, { color: selected ? 'rgba(255,255,255,0.85)' : theme.textMuted }]}>
                      {p.title}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </View>

            <DepthCard variant="card" style={styles.timerDisplayCard}>
              <Text style={[styles.timerBigDigits, { color: theme.navy }]}>
                {timerMin}:{timerSec}
              </Text>
              <Text style={[styles.stopwatchStatus, { color: theme.textMuted }]}>
                {timerActive ? 'COUNTDOWN IN PROGRESS' : timerRemainingSec === 0 ? 'COMPLETE!' : 'READY TO START'}
              </Text>

              {/* Progress Track */}
              <View style={[styles.timerProgressTrack, { backgroundColor: theme.surface }]}>
                <View
                  style={[
                    styles.timerProgressFill,
                    { width: `${Math.round(timerProgress * 100)}%`, backgroundColor: '#F59E0B' },
                  ]}
                />
              </View>

              {/* Controls */}
              <View style={styles.toolControlsRow}>
                <SmoothPressable
                  onPress={() => setTimerActive((a) => !a)}
                  style={[
                    styles.primaryToolBtn,
                    { backgroundColor: timerActive ? '#EF4444' : '#F59E0B' },
                  ]}
                >
                  <Ionicons name={timerActive ? 'pause' : 'play'} size={20} color="#FFFFFF" />
                  <Text style={styles.primaryToolBtnText}>
                    {timerActive ? 'Pause' : 'Start Timer'}
                  </Text>
                </SmoothPressable>

                <SmoothPressable
                  onPress={handleResetTimer}
                  style={[styles.secondaryToolBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Ionicons name="refresh" size={18} color={theme.navy} />
                  <Text style={[styles.secondaryToolBtnText, { color: theme.navy }]}>Reset</Text>
                </SmoothPressable>
              </View>
            </DepthCard>
          </View>
        )}

        {/* =================================================================== */}
        {/* TOOL 4: UNIT CONVERTER                                              */}
        {/* =================================================================== */}
        {activeTool === 'converter' && (
          <View style={styles.toolSection}>
            {/* Category Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {(Object.keys(CONVERTER_DATA) as UnitCategory[]).map((cat) => {
                const selected = convCategory === cat;
                return (
                  <SmoothPressable
                    key={cat}
                    onPress={() => {
                      setConvCategory(cat);
                      const units = Object.keys(CONVERTER_DATA[cat]);
                      setConvFromUnit(units[0] || '');
                      setConvToUnit(units[1] || units[0] || '');
                    }}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: selected ? '#10B981' : theme.card,
                        borderColor: selected ? '#10B981' : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.catPillText, { color: selected ? '#FFFFFF' : theme.navy }]}>
                      {cat}
                    </Text>
                  </SmoothPressable>
                );
              })}
            </ScrollView>

            <DepthCard variant="card" style={styles.converterCard}>
              {/* FROM input */}
              <View style={styles.convBlock}>
                <Text style={[styles.convLabel, { color: theme.textMuted }]}>FROM</Text>
                <TextInput
                  value={convFromValue}
                  onChangeText={setConvFromValue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.convInput,
                    {
                      color: theme.navy,
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitPillsRow}>
                  {Object.keys(CONVERTER_DATA[convCategory]).map((u) => {
                    const sel = convFromUnit === u;
                    return (
                      <SmoothPressable
                        key={u}
                        onPress={() => setConvFromUnit(u)}
                        style={[
                          styles.unitChoiceChip,
                          {
                            backgroundColor: sel ? 'rgba(16,185,129,0.18)' : theme.surface,
                            borderColor: sel ? '#10B981' : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.unitChoiceText, { color: sel ? '#10B981' : theme.textSecondary }]}>
                          {CONVERTER_DATA[convCategory][u]?.label || u}
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Swap Button */}
              <View style={styles.swapWrap}>
                <SmoothPressable
                  onPress={handleSwapUnits}
                  style={[styles.swapBtn, { backgroundColor: '#10B981' }]}
                >
                  <Ionicons name="swap-vertical" size={18} color="#FFFFFF" />
                </SmoothPressable>
              </View>

              {/* TO output */}
              <View style={styles.convBlock}>
                <Text style={[styles.convLabel, { color: theme.textMuted }]}>TO</Text>
                <View
                  style={[
                    styles.convOutputBox,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.convOutputVal, { color: theme.navy }]}>{convertedValue}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitPillsRow}>
                  {Object.keys(CONVERTER_DATA[convCategory]).map((u) => {
                    const sel = convToUnit === u;
                    return (
                      <SmoothPressable
                        key={u}
                        onPress={() => setConvToUnit(u)}
                        style={[
                          styles.unitChoiceChip,
                          {
                            backgroundColor: sel ? 'rgba(16,185,129,0.18)' : theme.surface,
                            borderColor: sel ? '#10B981' : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.unitChoiceText, { color: sel ? '#10B981' : theme.textSecondary }]}>
                          {CONVERTER_DATA[convCategory][u]?.label || u}
                        </Text>
                      </SmoothPressable>
                    );
                  })}
                </ScrollView>
              </View>
            </DepthCard>
          </View>
        )}

        {/* =================================================================== */}
        {/* TOOL 5: DIGITAL QUICK NOTES                                         */}
        {/* =================================================================== */}
        {activeTool === 'notes' && (
          <View style={styles.toolSection}>
            <DepthCard variant="card" style={styles.noteCreatorCard}>
              <View style={styles.rowBetween}>
                <Text style={[styles.cardTitle, { color: theme.navy }]}>Academic Scratchpad</Text>
                <Text style={[styles.charCount, { color: theme.textMuted }]}>
                  {noteContent.length} chars · {noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words
                </Text>
              </View>

              <TextInput
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Note Title (Optional)..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.noteTitleInput,
                  { color: theme.navy, backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              />

              <TextInput
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="Type formulas, quick lecture thoughts, or study reminders here..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.noteContentInput,
                  { color: theme.navy, backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              />

              <View style={styles.noteActionsRow}>
                <SmoothPressable
                  onPress={handleSaveQuickNote}
                  style={[styles.saveNoteBtn, { backgroundColor: '#8B5CF6' }]}
                >
                  <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                  <Text style={styles.saveNoteBtnText}>Save Offline Note</Text>
                </SmoothPressable>

                <SmoothPressable
                  onPress={() => {
                    setNoteTitle('');
                    setNoteContent('');
                  }}
                  style={[styles.clearNoteBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={[styles.clearNoteBtnText, { color: theme.textSecondary }]}>Clear</Text>
                </SmoothPressable>
              </View>
            </DepthCard>

            {/* Saved Notes Feed */}
            <View style={styles.notesFeedBlock}>
              <View style={styles.rowBetween}>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                  SAVED NOTES ({filteredNotes.length})
                </Text>
              </View>

              {account.savedNotes.length > 0 && (
                <TextInput
                  value={notesFilter}
                  onChangeText={setNotesFilter}
                  placeholder="Search saved notes..."
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.noteTitleInput,
                    {
                      color: theme.navy,
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                />
              )}

              {filteredNotes.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="document-text-outline" size={32} color={theme.textMuted} />
                  <Text style={[styles.emptyTitle, { color: theme.navy }]}>No saved notes yet</Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                    Notes you save here are safely archived offline in your student library.
                  </Text>
                </View>
              ) : (
                <View style={styles.notesList}>
                  {filteredNotes.map((note) => (
                    <DepthCard key={note.id} variant="mini" style={styles.savedNoteCard}>
                      <View style={styles.savedNoteHeader}>
                        <View style={styles.flex}>
                          <Text numberOfLines={1} style={[styles.savedNoteTitle, { color: theme.navy }]}>
                            {note.title}
                          </Text>
                          <Text style={[styles.savedNoteDate, { color: theme.textMuted }]}>
                            {new Date(note.createdAt).toLocaleDateString('en-US')} · {note.subjectName}
                          </Text>
                        </View>
                        <View style={styles.savedNoteActionRow}>
                          <SmoothPressable
                            onPress={() => handleCopyNote(`${note.title}\n\n${note.content}`)}
                            style={styles.noteIconBtn}
                          >
                            <Ionicons name="copy-outline" size={16} color={theme.navy} />
                          </SmoothPressable>
                          <SmoothPressable
                            onPress={() => handleDeleteSavedNote(note.id, note.title)}
                            style={styles.noteIconBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </SmoothPressable>
                        </View>
                      </View>
                      <Text style={[styles.savedNoteContent, { color: theme.textSecondary }]}>
                        {note.content}
                      </Text>
                    </DepthCard>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* =================================================================== */}
        {/* TOOL 6: PERSONAL TO-DO LIST                                         */}
        {/* =================================================================== */}
        {activeTool === 'todo' && (
          <View style={styles.toolSection}>
            {/* Add Todo Input */}
            <View style={styles.todoInputRow}>
              <TextInput
                value={todoInput}
                onChangeText={setTodoInput}
                onSubmitEditing={handleAddTodo}
                placeholder="Add quick study task (e.g., Read pages 40-52)..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.todoTextInput,
                  { color: theme.navy, backgroundColor: theme.card, borderColor: theme.border },
                ]}
              />
              <SmoothPressable
                onPress={handleAddTodo}
                style={[styles.addTodoBtn, { backgroundColor: '#EC4899' }]}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </SmoothPressable>
            </View>

            {/* Filter Pills & Actions */}
            <View style={styles.rowBetween}>
              <View style={styles.todoFilterGroup}>
                {(['all', 'pending', 'completed'] as const).map((f) => (
                  <SmoothPressable
                    key={f}
                    onPress={() => setTodoFilter(f)}
                    style={[
                      styles.todoFilterChip,
                      todoFilter === f && { backgroundColor: '#EC4899' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.todoFilterText,
                        { color: todoFilter === f ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </SmoothPressable>
                ))}
              </View>

              {personalTodos.some((t) => t.done) && (
                <SmoothPressable onPress={handleClearCompletedTodos}>
                  <Text style={[styles.clearCompletedText, { color: theme.textMuted }]}>
                    Clear Done
                  </Text>
                </SmoothPressable>
              )}
            </View>

            {/* Todo List */}
            {filteredTodos.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="checkbox-outline" size={32} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.navy }]}>No tasks to show</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Keep your day organized with instant personal study to-dos.
                </Text>
              </View>
            ) : (
              <View style={styles.todosList}>
                {filteredTodos.map((todo) => (
                  <DepthCard key={todo.id} variant="mini" style={styles.todoItemCard}>
                    <SmoothPressable
                      onPress={() => handleToggleTodo(todo.id)}
                      style={[
                        styles.todoCheckbox,
                        {
                          borderColor: todo.done ? '#10B981' : theme.border,
                          backgroundColor: todo.done ? '#10B981' : 'transparent',
                        },
                      ]}
                    >
                      {todo.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </SmoothPressable>

                    <Text
                      style={[
                        styles.todoItemText,
                        {
                          color: todo.done ? theme.textMuted : theme.navy,
                          textDecorationLine: todo.done ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {todo.text}
                    </Text>

                    <SmoothPressable
                      onPress={() => handleDeleteTodo(todo.id)}
                      style={styles.todoDeleteBtn}
                    >
                      <Ionicons name="close" size={16} color={theme.textMuted} />
                    </SmoothPressable>
                  </DepthCard>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  tabScrollWrap: {
    paddingVertical: 10,
  },
  tabScrollContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  toolTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  toolTabLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  mainScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 16,
  },
  toolSection: {
    gap: 16,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Calculator styles
  calcSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcTogglePillGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
    padding: 3,
  },
  calcToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9,
  },
  calcToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  angleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  angleBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  displayCard: {
    padding: 16,
    borderRadius: 18,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  displayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expressionText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'right',
    marginVertical: 4,
  },
  resultText: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  sciGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sciBtn: {
    width: '18%',
    flexGrow: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sciBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  keypad: {
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontSize: 18,
  },
  historyBlock: {
    gap: 8,
    marginTop: 6,
  },
  historyList: {
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyExpr: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyRes: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Stopwatch styles
  stopwatchCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  stopwatchDisplay: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  stopwatchStatus: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  toolControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  primaryToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
  },
  primaryToolBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryToolBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  lapsBlock: {
    gap: 8,
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lapIndex: {
    fontSize: 12.5,
    fontWeight: '800',
    width: 60,
  },
  lapSplit: {
    fontSize: 13,
    fontWeight: '700',
  },
  lapOverall: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Timer styles
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  presetChipLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  presetChipSub: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  timerDisplayCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  timerBigDigits: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  timerProgressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  timerProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Converter styles
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  converterCard: {
    padding: 16,
    gap: 14,
  },
  convBlock: {
    gap: 8,
  },
  convLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  convInput: {
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  convOutputBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  convOutputVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  unitPillsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  unitChoiceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  unitChoiceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  swapWrap: {
    alignItems: 'center',
    marginVertical: -4,
  },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Notes styles
  noteCreatorCard: {
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteTitleInput: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteContentInput: {
    fontSize: 13.5,
    lineHeight: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
  },
  noteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveNoteBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  clearNoteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearNoteBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  notesFeedBlock: {
    gap: 10,
  },
  notesList: {
    gap: 10,
  },
  savedNoteCard: {
    padding: 14,
    gap: 8,
  },
  savedNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedNoteTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  savedNoteDate: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  savedNoteActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteIconBtn: {
    padding: 4,
  },
  savedNoteContent: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Todo styles
  todoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  todoTextInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  addTodoBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoFilterGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 10,
    padding: 2,
  },
  todoFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  todoFilterText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  clearCompletedText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  todosList: {
    gap: 8,
  },
  todoItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoItemText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  todoDeleteBtn: {
    padding: 4,
  },

  // Empty state
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

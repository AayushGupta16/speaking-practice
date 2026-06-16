'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildCustomPrompt, promptCategories, prompts, type PromptCategory } from '../lib/prompts';
import { likert, ratingAreas, ratingsToGrade, type Likert } from '../lib/ratings';
import { getSessionVideo, listSessions, saveSession, updateSessionFeedback, type AiFeedback, type PracticeSession } from '../lib/sessions';

type Stage = 'prompt' | 'recording' | 'review' | 'results';

type CurrentPrompt = {
  text: string;
  categoryLabel: string;
  coachingFocus: string;
  structureHint: string;
};

const defaultRatings = Object.fromEntries(ratingAreas.map((area) => [area, 'Solid'])) as Record<string, Likert>;

export default function Home() {
  const [stage, setStage] = useState<Stage>('prompt');
  const [category, setCategory] = useState<PromptCategory | 'any'>('any');
  const [customTopic, setCustomTopic] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState<CurrentPrompt>({
    text: prompts[0].text,
    categoryLabel: promptCategories[prompts[0].category],
    coachingFocus: prompts[0].coachingFocus,
    structureHint: prompts[0].structureHint,
  });
  const [notes, setNotes] = useState('');
  const [ratings, setRatings] = useState<Record<string, Likert>>(defaultRatings);
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob>();
  const [videoUrl, setVideoUrl] = useState<string>();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PracticeSession>();
  const [referenceSession, setReferenceSession] = useState<PracticeSession>();
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>();
  const [ai, setAi] = useState<AiFeedback>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState('Ready for a new rep.');

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  const grade = useMemo(() => ratingsToGrade(ratings), [ratings]);

  useEffect(() => {
    void refreshSessions();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  async function refreshSessions() {
    if (!('indexedDB' in window)) return;
    setSessions(await listSessions());
  }

  function generatePrompt() {
    if (customTopic.trim()) {
      const custom = buildCustomPrompt(customTopic.trim());
      setCurrentPrompt({ categoryLabel: 'Custom topic/event', ...custom });
    } else {
      const pool = category === 'any' ? prompts : prompts.filter((prompt) => prompt.category === category);
      const next = pool[Math.floor(Math.random() * pool.length)];
      setCurrentPrompt({
        text: next.text,
        categoryLabel: promptCategories[next.category],
        coachingFocus: next.coachingFocus,
        structureHint: next.structureHint,
      });
    }
    resetAttempt(false);
    setStatus('Prompt generated. Start recording when ready.');
  }

  function resetAttempt(clearPrompt = true) {
    setStage('prompt');
    setNotes('');
    setRatings(defaultRatings);
    setElapsedSeconds(0);
    setVideoBlob(undefined);
    setAi(undefined);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(undefined);
    if (clearPrompt) generatePrompt();
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    chunks.current = [];
    setElapsedSeconds(0);
    setVideoBlob(undefined);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(undefined);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      await videoRef.current.play();
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    recorder.current = new MediaRecorder(stream, { mimeType });
    recorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    recorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: mimeType });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.muted = false;
      }
      setStage('review');
      setStatus('Recording ready. Watch it back, finish notes, then analyze or save.');
    };

    recorder.current.start(1000);
    timerRef.current = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    setRecording(true);
    setStage('recording');
    setStatus('Recording. Keep notes open if you notice something in the moment.');
  }

  function stopRecording() {
    recorder.current?.stop();
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRecording(false);
  }

  async function persistSession(feedback = ai) {
    if (!videoBlob) {
      setStatus('Record a video before saving.');
      return undefined;
    }
    const session: PracticeSession = {
      id: crypto.randomUUID(),
      prompt: currentPrompt.text,
      categoryLabel: currentPrompt.categoryLabel,
      coachingFocus: currentPrompt.coachingFocus,
      structureHint: currentPrompt.structureHint,
      notes,
      ratings,
      grade: feedback?.grade ?? grade,
      durationSeconds: elapsedSeconds,
      mimeType: videoBlob.type,
      createdAt: new Date().toISOString(),
      ai: feedback,
      referenceSessionId: referenceSession?.id,
    };
    await saveSession(session, videoBlob);
    await refreshSessions();
    setStatus('Saved locally. You can revisit the recording from history.');
    return session;
  }

  async function analyze() {
    if (!videoBlob) {
      setStatus('Record a video before requesting analysis.');
      return;
    }
    setIsAnalyzing(true);
    setStatus('Sending recording and notes for Gemini analysis...');
    const form = new FormData();
    form.set('video', videoBlob, `speaking-practice-${Date.now()}.webm`);
    form.set('prompt', currentPrompt.text);
    form.set('notes', notes);
    form.set('ratings', JSON.stringify(ratings));
    form.set('durationSeconds', String(elapsedSeconds));
    if (referenceSession) {
      form.set('referenceMetadata', JSON.stringify({
        id: referenceSession.id,
        prompt: referenceSession.prompt,
        notes: referenceSession.notes,
        ratings: referenceSession.ratings,
        grade: referenceSession.grade,
        durationSeconds: referenceSession.durationSeconds,
        ai: referenceSession.ai,
      }));
      const referenceBlob = await getSessionVideo(referenceSession.id);
      if (referenceBlob) form.set('referenceVideo', referenceBlob, `reference-${referenceSession.id}.webm`);
    }

    const response = await fetch('/api/analyze', { method: 'POST', body: form });
    const feedback = (await response.json()) as AiFeedback;
    setAi(feedback);
    setStage('results');
    setIsAnalyzing(false);
    setStatus(referenceSession ? 'Analysis complete with reference comparison. Save this rep to track progress over time.' : 'Analysis complete. Save this rep to track progress over time.');
  }

  async function saveAndUpdateSession() {
    const session = await persistSession();
    if (session?.ai) await updateSessionFeedback(session.id, session.ai);
  }

  async function openSession(session: PracticeSession) {
    setSelectedSession(session);
    if (selectedVideoUrl) URL.revokeObjectURL(selectedVideoUrl);
    const blob = await getSessionVideo(session.id);
    setSelectedVideoUrl(blob ? URL.createObjectURL(blob) : undefined);
  }

  function selectAsReference(session: PracticeSession) {
    setReferenceSession(session);
    setStatus('Reference recording selected. Your next Gemini analysis will compare against it.');
  }

  function clearReference() {
    setReferenceSession(undefined);
    setStatus('Reference recording cleared.');
  }

  function redoPrompt(session: PracticeSession) {
    setCurrentPrompt({
      text: session.prompt,
      categoryLabel: session.categoryLabel,
      coachingFocus: session.coachingFocus,
      structureHint: session.structureHint,
    });
    resetAttempt(false);
    setStatus('Loaded an old prompt. Try to beat your prior rep.');
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6">
      <section className="rounded-3xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Monkeytype for speaking</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-5xl font-black">Practice speaking under pressure.</h1>
            <p className="mt-4 max-w-3xl text-slate-300">Generate a topic, record a rep, take notes while you respond, self-rate with Likert scales, then ask Gemini for coaching on delivery, substance, and progress against old recordings.</p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-4 text-center">
            <p className="text-sm text-slate-400">Current stage</p>
            <p className="text-2xl font-bold capitalize text-cyan-300">{stage}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-slate-800 p-5 md:grid-cols-[1fr_1fr_auto]">
        <select className="rounded-xl bg-slate-950 p-3" value={category} onChange={(event) => setCategory(event.target.value as PromptCategory | 'any')}>
          <option value="any">Any category</option>
          {Object.entries(promptCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <input className="rounded-xl bg-slate-950 p-3" placeholder="Specific topic/event, e.g. YC interview, date conversation, product launch" value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} />
        <button className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950" onClick={generatePrompt}>Generate prompt</button>
      </section>

      {referenceSession && (
        <section className="rounded-2xl border border-purple-400/40 bg-purple-500/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-purple-200">Reference recording selected</p>
              <p className="font-semibold text-purple-50">{referenceSession.prompt}</p>
              <p className="text-sm text-purple-100">Gemini will compare the next recording against this saved rep.</p>
            </div>
            <button className="rounded-xl bg-purple-200 px-4 py-2 font-bold text-purple-950" onClick={clearReference}>Clear reference</button>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl bg-slate-800 p-6">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200">{currentPrompt.categoryLabel}</span>
            <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-indigo-200">Focus: {currentPrompt.coachingFocus}</span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">{currentPrompt.structureHint}</span>
          </div>
          <h2 className="text-3xl font-bold">{currentPrompt.text}</h2>
          <video ref={videoRef} src={videoUrl} controls={!recording && Boolean(videoUrl)} className="aspect-video w-full rounded-2xl bg-black" />
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50" onClick={startRecording} disabled={recording}>Start recording</button>
            <button className="rounded-xl bg-rose-500 px-4 py-2 font-bold text-white disabled:opacity-50" onClick={stopRecording} disabled={!recording}>Stop</button>
            <button className="rounded-xl bg-indigo-500 px-4 py-2 font-bold text-white disabled:opacity-50" onClick={analyze} disabled={!videoBlob || isAnalyzing}>{isAnalyzing ? 'Analyzing…' : 'Analyze with Gemini'}</button>
            <button className="rounded-xl bg-slate-700 px-4 py-2 font-bold disabled:opacity-50" onClick={saveAndUpdateSession} disabled={!videoBlob}>Save rep</button>
            <button className="rounded-xl bg-slate-950 px-4 py-2 font-bold" onClick={() => resetAttempt()}>New rep</button>
            <span className="font-mono text-lg text-cyan-200">{Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}</span>
          </div>
          <p className="rounded-xl bg-slate-950 p-3 text-sm text-slate-300">{status}</p>
        </div>

        <div className="space-y-4 rounded-2xl bg-slate-800 p-6">
          <h2 className="text-2xl font-bold">Live notes & self-rating</h2>
          <textarea className="h-44 w-full rounded-xl bg-slate-950 p-3" placeholder="Take notes while or after speaking: filler words, strong moments, what to redo..." value={notes} onChange={(event) => setNotes(event.target.value)} />
          {ratingAreas.map((area) => (
            <label key={area} className="flex items-center justify-between gap-3">
              <span>{area}</span>
              <select className="rounded-xl bg-slate-950 p-2" value={ratings[area]} onChange={(event) => setRatings({ ...ratings, [area]: event.target.value as Likert })}>
                {likert.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
          ))}
          <p className="rounded-xl bg-slate-950 p-3 font-bold">Self grade: {grade}/100</p>
        </div>
      </section>

      {ai && (
        <section className="rounded-2xl bg-slate-800 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">AI coaching</h2>
            {ai.overall_rating && <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200">Overall: {ai.overall_rating}</span>}
            {ai.depth_rating && <span className="rounded-full bg-purple-500/15 px-3 py-1 text-purple-200">Depth: {ai.depth_rating}</span>}
            {ai.grade && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">Derived grade: {ai.grade}/100</span>}
            {referenceSession && <span className="rounded-full bg-purple-500/15 px-3 py-1 text-purple-200">Compared to reference</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-slate-200">{ai.summary}</p>
          {ai.depth_feedback && <p className="mt-4 rounded-xl bg-purple-500/10 p-3 text-purple-100"><strong>Depth/substance:</strong> {ai.depth_feedback}</p>}
          {ai.comparison_summary && <p className="mt-4 rounded-xl bg-cyan-500/10 p-3 text-cyan-100"><strong>Comparison:</strong> {ai.comparison_summary}</p>}
          {ai.surface_level_flags && ai.surface_level_flags.length > 0 && <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-amber-100"><strong>Surface-level flags:</strong><ul className="mt-2 list-disc pl-5">{ai.surface_level_flags.map((flag) => <li key={flag}>{flag}</li>)}</ul></div>}
          {ai.next_drill && <p className="mt-4 rounded-xl bg-slate-950 p-3"><strong>Next drill:</strong> {ai.next_drill}</p>}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl bg-slate-800 p-6">
          <h2 className="text-2xl font-bold">Saved sessions</h2>
          <div className="mt-4 grid gap-3">
            {sessions.length === 0 && <p className="text-slate-400">No saved reps yet. Save one to build your archive.</p>}
            {sessions.map((session) => (
              <button key={session.id} className="rounded-xl bg-slate-950 p-4 text-left hover:bg-slate-900" onClick={() => openSession(session)}>
                <p className="text-sm text-slate-400">{new Date(session.createdAt).toLocaleString()} · {session.durationSeconds}s · {session.grade}/100</p>
                <p className="font-semibold">{session.prompt}</p>
                <p className="text-sm text-cyan-200">{session.categoryLabel}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6">
          <h2 className="text-2xl font-bold">Session detail</h2>
          {!selectedSession && <p className="mt-4 text-slate-400">Select an old rep to watch it back, review notes, and redo the same prompt.</p>}
          {selectedSession && (
            <div className="mt-4 space-y-4">
              {selectedVideoUrl && <video src={selectedVideoUrl} controls className="w-full rounded-2xl bg-black" />}
              <p className="font-semibold">{selectedSession.prompt}</p>
              <p className="text-sm text-slate-300">Notes: {selectedSession.notes || 'No notes saved.'}</p>
              {selectedSession.ai?.summary && <p className="rounded-xl bg-slate-950 p-3 text-sm whitespace-pre-wrap">{selectedSession.ai.summary}</p>}
              {selectedSession.ai?.depth_feedback && <p className="rounded-xl bg-purple-500/10 p-3 text-sm text-purple-100"><strong>Depth/substance:</strong> {selectedSession.ai.depth_feedback}</p>}
              {selectedSession.ai?.comparison_summary && <p className="rounded-xl bg-cyan-500/10 p-3 text-sm text-cyan-100"><strong>Comparison:</strong> {selectedSession.ai.comparison_summary}</p>}
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl bg-purple-500 px-4 py-2 font-bold text-white" onClick={() => selectAsReference(selectedSession)}>Use as reference</button>
                <button className="rounded-xl bg-cyan-500 px-4 py-2 font-bold text-slate-950" onClick={() => redoPrompt(selectedSession)}>Redo this prompt</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

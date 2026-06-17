'use client';

import { useState, useEffect, useCallback } from 'react';
import { listApiKeys, generateApiKey, revokeApiKey } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function KeyRow({ apiKey, onRevoke }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/40">
          <KeyRound className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">{apiKey.name}</p>
          <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] mt-0.5">
            {apiKey.key_prefix}<span className="opacity-50">••••••••••••••••••••••••••••</span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
            <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {formatDate(apiKey.created_at)}
            </span>
            {apiKey.last_used_at && (
              <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Last used {formatDate(apiKey.last_used_at)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800">
          Active
        </span>
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Revoke?</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={() => { onRevoke(apiKey.id); setConfirming(false); }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setConfirming(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => setConfirming(true)}
            title="Revoke key"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function NewKeyModal({ rawKey, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/40">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">API Key Generated</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Copy it now — it won't be shown again.</p>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Store this key securely. For security, we only store a hash and cannot show the full key again.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[hsl(var(--muted-foreground))]">Your API Key</Label>
          <div className="flex gap-2">
            <code className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5 text-sm font-mono text-[hsl(var(--foreground))] overflow-x-auto whitespace-nowrap">
              {rawKey}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={copy}
              className="shrink-0 h-10 w-10"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[hsl(var(--muted-foreground))]">How to use</Label>
          <code className="block rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2.5 text-xs font-mono text-[hsl(var(--foreground))] whitespace-pre-wrap">
{`POST /write-data
X-API-Key: ${rawKey}
Content-Type: application/json

{
  "pH": 7.2,
  "temperature": 22.5,
  "DO_mgL": 6.8,
  "conductivity": 450.0,
  "turbidity": 3.5
}`}
          </code>
        </div>

        <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white" onClick={onClose}>
          Done — I've saved my key
        </Button>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newRawKey, setNewRawKey] = useState(null);

  const fetchKeys = useCallback(async () => {
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const created = await generateApiKey(newKeyName.trim());
      setNewRawKey(created.key);
      setNewKeyName('');
      setShowForm(false);
      await fetchKeys();
      toast.success('API key created!');
    } catch {
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId) => {
    try {
      await revokeApiKey(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast.success('API key revoked');
    } catch {
      toast.error('Failed to revoke API key');
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">API Keys</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Use these keys to write sensor data to your account via the <code className="text-xs bg-[hsl(var(--muted))] px-1 py-0.5 rounded">/write-data</code> endpoint.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white shrink-0"
        >
          <Plus className="h-4 w-4" />
          New API Key
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Key</CardTitle>
            <CardDescription>Give it a descriptive name so you remember what it's for.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Raspberry Pi Sensor, Lab Device #2"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={creating} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  {creating ? 'Generating…' : 'Generate Key'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keys list */}
      <Card>
        <CardHeader>
          <CardTitle>Your Keys</CardTitle>
          <CardDescription>
            {keys.length === 0 && !loading
              ? 'No API keys yet. Create one to start pushing sensor data.'
              : `${keys.length} active key${keys.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
                <KeyRound className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No API keys yet</p>
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Create your first key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <KeyRow key={key.id} apiKey={key} onRevoke={handleRevoke} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write API docs */}
      <Card>
        <CardHeader>
          <CardTitle>Write API Reference</CardTitle>
          <CardDescription>Push readings from IoT sensors or scripts using your API key.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-[hsl(var(--muted))] p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Endpoint</p>
            <code className="text-sm font-mono text-[hsl(var(--foreground))]">
              POST {process.env.NEXT_PUBLIC_API_URL}/write-data
            </code>
          </div>
          <div className="rounded-xl bg-[hsl(var(--muted))] p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Request</p>
            <pre className="text-xs font-mono text-[hsl(var(--foreground))] whitespace-pre-wrap">
{`X-API-Key: btp_<your-key>
Content-Type: application/json

{
  "timestamp": "2026-05-02 12:00:00",  // optional, defaults to now
  "pH": 7.2,
  "temperature": 22.5,
  "DO_mgL": 6.8,
  "conductivity": 450.0,
  "turbidity": 3.5
}`}
            </pre>
          </div>
          <div className="rounded-xl bg-[hsl(var(--muted))] p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Response (201)</p>
            <pre className="text-xs font-mono text-[hsl(var(--foreground))]">
{`{
  "success": true,
  "message": "Record saved successfully",
  "record_id": 142
}`}
            </pre>
          </div>
          <div className="rounded-xl bg-[hsl(var(--muted))] p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">cURL example</p>
            <pre className="text-xs font-mono text-[hsl(var(--foreground))] whitespace-pre-wrap overflow-x-auto">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/write-data \\
  -H "X-API-Key: btp_<your-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"pH":7.1,"temperature":23,"DO_mgL":6.5,"conductivity":420,"turbidity":2.8}'`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Modal for newly created key */}
      {newRawKey && (
        <NewKeyModal rawKey={newRawKey} onClose={() => setNewRawKey(null)} />
      )}
    </div>
  );
}

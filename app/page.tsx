"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Search,
  CircleDot,
  CheckCircle2,
  Clock,
  Tag,
  ExternalLink,
  X,
  RefreshCw,
  AlertCircle,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: GitHubLabel[];
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  html_url: string;
}

type FilterState = "all" | "open" | "closed";

// Category tabs configuration
const CATEGORY_TABS = [
  { id: "all", label: "All", labelName: null },
  { id: "backend", label: "Backend", labelName: "medusa-backend" },
  { id: "frontend", label: "Frontend", labelName: "medusa-frontend" },
  { id: "strapi", label: "Strapi", labelName: "strapi-cms" },
] as const;

const CATEGORY_LABEL_NAMES = ["medusa-backend", "medusa-frontend", "strapi-cms"];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  "high-priority": "bg-orange-500",
  "medium-priority": "bg-yellow-500",
  "low-priority": "bg-green-500",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function getPriorityLabel(labels: GitHubLabel[]): GitHubLabel | undefined {
  return labels.find(
    (l) => l.name === "critical" || l.name.includes("priority")
  );
}

function IssueCard({
  issue,
  onClick,
}: {
  issue: GitHubIssue;
  onClick: () => void;
}) {
  const priorityLabel = getPriorityLabel(issue.labels);
  const otherLabels = issue.labels.filter((l) => l !== priorityLabel).slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-xl cursor-pointer",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "hover:border-zinc-300 dark:hover:border-zinc-700",
        "hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50",
        "transition-all duration-200"
      )}
    >
      {priorityLabel && (
        <div
          className={cn(
            "absolute top-0 left-4 w-12 h-1 rounded-b-full",
            PRIORITY_COLORS[priorityLabel.name] || "bg-blue-500"
          )}
        />
      )}

      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {issue.state === "open" ? (
            <CircleDot className="w-5 h-5 text-green-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-purple-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate pr-8">
            <span className="text-zinc-400 dark:text-zinc-500 mr-2">
              #{issue.number}
            </span>
            {issue.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(issue.created_at)}
            </span>
            <span>by {issue.user.login}</span>
          </div>

          {otherLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {otherLabels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `#${label.color}20`,
                    color: `#${label.color}`,
                    border: `1px solid #${label.color}40`,
                  }}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <a
          href={issue.html_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ExternalLink className="w-4 h-4 text-zinc-400" />
        </a>
      </div>
    </motion.div>
  );
}

function IssueDrawer({
  issue,
  labels,
  open,
  onOpenChange,
  onUpdate,
}: {
  issue: GitHubIssue | null;
  labels: GitHubLabel[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [labelSearch, setLabelSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setBody(issue.body || "");
      setSelectedLabels(issue.labels.map((l) => l.name));
      setIsEditing(false);
      setLabelSearch("");
    }
  }, [issue]);

  const handleSave = async () => {
    if (!issue) return;
    
    // Validate at least one category label is selected
    const hasCategoryLabel = selectedLabels.some((l) =>
      CATEGORY_LABEL_NAMES.includes(l)
    );
    if (!hasCategoryLabel) {
      alert("Please select at least one category (Backend, Frontend, or Strapi)");
      return;
    }

    setIsSaving(true);
    try {
      await fetch(`/api/issues/${issue.number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, labels: selectedLabels }),
      });
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleState = async () => {
    if (!issue) return;
    setIsSaving(true);
    try {
      await fetch(`/api/issues/${issue.number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: issue.state === "open" ? "closed" : "open",
        }),
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to toggle state:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelName)
        ? prev.filter((l) => l !== labelName)
        : [...prev, labelName]
    );
  };

  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return [];
    const search = labelSearch.toLowerCase();
    return labels
      .filter(
        (l) =>
          l.name.toLowerCase().includes(search) &&
          !selectedLabels.includes(l.name)
      )
      .slice(0, 8);
  }, [labels, labelSearch, selectedLabels]);

  if (!issue) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-6xl overflow-y-auto px-4">
          <DrawerHeader className="text-left px-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {issue.state === "open" ? (
                  <CircleDot className="w-5 h-5 text-green-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-purple-500" />
                )}
                <span className="text-zinc-400 dark:text-zinc-500">
                  #{issue.number}
                </span>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>

            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold mt-2"
              />
            ) : (
              <DrawerTitle className="text-xl font-semibold mt-2">
                {issue.title}
              </DrawerTitle>
            )}

            <DrawerDescription className="flex items-center gap-2 mt-2">
              <img
                src={issue.user.avatar_url}
                alt={issue.user.login}
                className="w-5 h-5 rounded-full"
              />
              <span>{issue.user.login}</span>
              <span>•</span>
              <span>{formatDate(issue.created_at)}</span>
            </DrawerDescription>
          </DrawerHeader>

          <div className="pb-4">
            {/* Labels */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Labels
              </h4>
              
              {isEditing ? (
                <div className="space-y-3">
                  {/* Selected labels */}
                  <div className="flex flex-wrap gap-2">
                    {selectedLabels.map((labelName) => {
                      const label = labels.find((l) => l.name === labelName);
                      const isCategory = CATEGORY_LABEL_NAMES.includes(labelName);
                      return (
                        <button
                          key={labelName}
                          onClick={() => toggleLabel(labelName)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                            isCategory && "ring-2 ring-offset-1"
                          )}
                          style={{
                            backgroundColor: label ? `#${label.color}20` : "#71717a20",
                            color: label ? `#${label.color}` : "#71717a",
                            border: label ? `1px solid #${label.color}40` : "1px solid #71717a40",
                          }}
                        >
                          {labelName}
                          <X className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Label search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="Search labels to add..."
                      value={labelSearch}
                      onChange={(e) => setLabelSearch(e.target.value)}
                      className="pl-10 h-9 text-sm"
                    />
                  </div>

                  {/* Search results */}
                  {filteredLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      {filteredLabels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => {
                            toggleLabel(label.name);
                            setLabelSearch("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium hover:ring-2 hover:ring-offset-1 transition-all"
                          style={{
                            backgroundColor: `#${label.color}20`,
                            color: `#${label.color}`,
                            border: `1px solid #${label.color}40`,
                          }}
                        >
                          <Plus className="w-3 h-3" />
                          {label.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Category labels hint */}
                  <p className="text-xs text-zinc-500">
                    * Issue must have at least one category: medusa-backend, medusa-frontend, or strapi-cms
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {issue.labels.length > 0 ? (
                    issue.labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `#${label.color}20`,
                          color: `#${label.color}`,
                          border: `1px solid #${label.color}40`,
                        }}
                      >
                        {label.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-zinc-500">No labels</span>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description
              </h4>
              {isEditing ? (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full h-64 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {issue.body || "No description provided."}
                </div>
              )}
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2 px-0">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(issue.title);
                    setBody(issue.body || "");
                    setSelectedLabels(issue.labels.map((l) => l.name));
                    setLabelSearch("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleToggleState}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {issue.state === "open" ? "Close Issue" : "Reopen Issue"}
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Edit Issue
                </Button>
              </>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CreateIssueDrawer({
  labels,
  open,
  onOpenChange,
  onCreate,
}: {
  labels: GitHubLabel[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, labels: selectedLabels }),
      });
      onCreate();
      onOpenChange(false);
      setTitle("");
      setBody("");
      setSelectedLabels([]);
    } catch (error) {
      console.error("Failed to create:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelName)
        ? prev.filter((l) => l !== labelName)
        : [...prev, labelName]
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-6xl overflow-y-auto px-4">
          <DrawerHeader className="text-left px-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-semibold">
                Create New Issue
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
            <DrawerDescription>
              Create a new issue for the repository
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title..."
                className="text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.name)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                      selectedLabels.includes(label.name)
                        ? "ring-2 ring-offset-2 ring-offset-background"
                        : "opacity-50 hover:opacity-75"
                    )}
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}40`,
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                Description
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full h-48 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isCreating ? "Creating..." : "Create Issue"}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [labels, setLabels] = useState<GitHubLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterState, setFilterState] = useState<FilterState>("all");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/issues?state=all`);
      if (!response.ok) throw new Error("Failed to fetch issues");
      const data = await response.json();
      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLabels = useCallback(async () => {
    try {
      const response = await fetch("/api/labels");
      if (!response.ok) throw new Error("Failed to fetch labels");
      const data = await response.json();
      setLabels(data);
    } catch (err) {
      console.error("Failed to fetch labels:", err);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    fetchLabels();
  }, [fetchIssues, fetchLabels]);

  // Get current category tab config
  const currentTab = CATEGORY_TABS.find((t) => t.id === activeTab) || CATEGORY_TABS[0];

  // Filter issues by category tab first
  const issuesInTab = useMemo(() => {
    if (currentTab.labelName === null) return issues;
    return issues.filter((issue) =>
      issue.labels.some((l) => l.name === currentTab.labelName)
    );
  }, [issues, currentTab]);

  // Get counts for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of CATEGORY_TABS) {
      if (tab.labelName === null) {
        counts[tab.id] = issues.length;
      } else {
        counts[tab.id] = issues.filter((i) =>
          i.labels.some((l) => l.name === tab.labelName)
        ).length;
      }
    }
    return counts;
  }, [issues]);

  // Get available filter labels and their counts for issues in current tab
  const availableFilters = useMemo(() => {
    const labelCounts: Record<string, { label: GitHubLabel; count: number }> = {};
    
    for (const issue of issuesInTab) {
      for (const label of issue.labels) {
        // Skip category labels from filters
        if (CATEGORY_LABEL_NAMES.includes(label.name)) continue;
        
        if (!labelCounts[label.name]) {
          labelCounts[label.name] = { label, count: 0 };
        }
        labelCounts[label.name].count++;
      }
    }
    
    return Object.values(labelCounts).sort((a, b) => b.count - a.count);
  }, [issuesInTab]);

  // Apply all filters (state, search, selected labels with AND logic)
  const filteredIssues = useMemo(() => {
    let result = issuesInTab;

    // Filter by state
    if (filterState !== "all") {
      result = result.filter((i) => i.state === filterState);
    }

    // Filter by selected labels (AND logic)
    if (selectedFilters.length > 0) {
      result = result.filter((issue) =>
        selectedFilters.every((filterLabel) =>
          issue.labels.some((l) => l.name === filterLabel)
        )
      );
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query) ||
          issue.body?.toLowerCase().includes(query) ||
          issue.labels.some((l) => l.name.toLowerCase().includes(query)) ||
          issue.number.toString().includes(query)
      );
    }

    return result;
  }, [issuesInTab, filterState, selectedFilters, searchQuery]);

  const stats = useMemo(() => {
    const open = issuesInTab.filter((i) => i.state === "open").length;
    const closed = issuesInTab.filter((i) => i.state === "closed").length;
    const critical = issuesInTab.filter((i) =>
      i.labels.some((l) => l.name === "critical")
    ).length;
    return { open, closed, critical, total: issuesInTab.length };
  }, [issuesInTab]);

  const handleIssueClick = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
  };

  const handleRefresh = () => {
    fetchIssues();
  };

  const toggleFilter = (labelName: string) => {
    setSelectedFilters((prev) =>
      prev.includes(labelName)
        ? prev.filter((l) => l !== labelName)
        : [...prev, labelName]
    );
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedFilters([]); // Clear filters when changing tabs
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Issues
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                mintpixels/grillers-documentation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("w-4 h-4", isLoading && "animate-spin")}
                />
              </Button>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Issue
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 mt-4 border-b border-zinc-200 dark:border-zinc-800 -mb-px">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {tab.label}
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {tabCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-6">
              {/* Stats */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                  Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Open</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{stats.open}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600">Closed</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{stats.closed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Critical</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{stats.critical}</span>
                  </div>
                </div>
              </div>

              {/* State Filter */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                  Status
                </h3>
                <div className="space-y-1">
                  {(["all", "open", "closed"] as FilterState[]).map((state) => (
                    <button
                      key={state}
                      onClick={() => setFilterState(state)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                        filterState === state
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      {state.charAt(0).toUpperCase() + state.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label Filters */}
              {availableFilters.length > 0 && (
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                    Labels
                  </h3>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {availableFilters.map(({ label, count }) => (
                      <button
                        key={label.id}
                        onClick={() => toggleFilter(label.name)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                          selectedFilters.includes(label.name)
                            ? "bg-zinc-100 dark:bg-zinc-800"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {selectedFilters.includes(label.name) && (
                            <Check className="w-3 h-3 text-green-500" />
                          )}
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: `#${label.color}` }}
                          />
                          <span className={cn(
                            selectedFilters.includes(label.name)
                              ? "text-zinc-900 dark:text-zinc-100 font-medium"
                              : "text-zinc-600 dark:text-zinc-400"
                          )}>
                            {label.name}
                          </span>
                        </span>
                        <span className="text-xs text-zinc-400">({count})</span>
                      </button>
                    ))}
                  </div>
                  {selectedFilters.length > 0 && (
                    <button
                      onClick={() => setSelectedFilters([])}
                      className="mt-3 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Active filters display */}
              {selectedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedFilters.map((filterName) => {
                    const label = labels.find((l) => l.name === filterName);
                    return (
                      <button
                        key={filterName}
                        onClick={() => toggleFilter(filterName)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: label ? `#${label.color}20` : undefined,
                          color: label ? `#${label.color}` : undefined,
                          border: label ? `1px solid #${label.color}40` : undefined,
                        }}
                      >
                        {filterName}
                        <X className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </motion.div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            )}

            {!isLoading && (
              <div className="space-y-3">
                <div className="text-sm text-zinc-500 mb-4">
                  {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""}
                </div>
                <AnimatePresence mode="popLayout">
                  {filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={() => handleIssueClick(issue)}
                    />
                  ))}
                </AnimatePresence>

                {filteredIssues.length === 0 && !error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <CircleDot className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400">
                      No issues found
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <IssueDrawer
        issue={selectedIssue}
        labels={labels}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={() => {
          fetchIssues();
          if (selectedIssue) {
            fetch(`/api/issues/${selectedIssue.number}`)
              .then((r) => r.json())
              .then(setSelectedIssue);
          }
        }}
      />

      <CreateIssueDrawer
        labels={labels}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={fetchIssues}
      />
    </div>
  );
}

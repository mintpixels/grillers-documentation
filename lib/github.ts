const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;

const BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json",
};

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubIssue {
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

export interface CreateIssueParams {
  title: string;
  body?: string;
  labels?: string[];
}

export interface UpdateIssueParams {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  labels?: string[];
}

export async function getIssues(
  state: "open" | "closed" | "all" = "all",
  labels?: string
): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      state,
      per_page: "100",
      page: page.toString(),
      sort: "created",
      direction: "desc",
    });

    if (labels) {
      params.append("labels", labels);
    }

    const response = await fetch(`${BASE_URL}/issues?${params}`, {
      headers,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch issues: ${response.statusText}`);
    }

    const issues: GitHubIssue[] = await response.json();
    allIssues.push(...issues);

    // If we got fewer than 100, we've reached the end
    if (issues.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allIssues;
}

export async function getIssue(issueNumber: number): Promise<GitHubIssue> {
  const response = await fetch(`${BASE_URL}/issues/${issueNumber}`, {
    headers,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch issue: ${response.statusText}`);
  }

  return response.json();
}

export async function createIssue(
  params: CreateIssueParams
): Promise<GitHubIssue> {
  const response = await fetch(`${BASE_URL}/issues`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to create issue: ${response.statusText}`);
  }

  return response.json();
}

export async function updateIssue(
  issueNumber: number,
  params: UpdateIssueParams
): Promise<GitHubIssue> {
  const response = await fetch(`${BASE_URL}/issues/${issueNumber}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to update issue: ${response.statusText}`);
  }

  return response.json();
}

export async function getLabels(): Promise<GitHubLabel[]> {
  const response = await fetch(`${BASE_URL}/labels?per_page=100`, {
    headers,
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch labels: ${response.statusText}`);
  }

  return response.json();
}

export async function getIssueComments(
  issueNumber: number
): Promise<GitHubComment[]> {
  const response = await fetch(
    `${BASE_URL}/issues/${issueNumber}/comments?per_page=100`,
    {
      headers,
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.statusText}`);
  }

  return response.json();
}

export async function createComment(
  issueNumber: number,
  body: string
): Promise<GitHubComment> {
  const response = await fetch(
    `${BASE_URL}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create comment: ${response.statusText}`);
  }

  return response.json();
}

import { NextRequest, NextResponse } from "next/server";
import { getIssueComments, createComment } from "@/lib/github";

type RouteParams = { params: Promise<{ number: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { number } = await params;
    const issueNumber = parseInt(number, 10);

    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: "Invalid issue number" },
        { status: 400 }
      );
    }

    const comments = await getIssueComments(issueNumber);
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { number } = await params;
    const issueNumber = parseInt(number, 10);

    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: "Invalid issue number" },
        { status: 400 }
      );
    }

    const { body } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    const comment = await createComment(issueNumber, body);
    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

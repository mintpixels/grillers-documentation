import { NextRequest, NextResponse } from "next/server";
import { getIssue, updateIssue } from "@/lib/github";

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

    const issue = await getIssue(issueNumber);
    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { number } = await params;
    const issueNumber = parseInt(number, 10);

    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: "Invalid issue number" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, body: issueBody, state, labels } = body;

    const issue = await updateIssue(issueNumber, {
      title,
      body: issueBody,
      state,
      labels,
    });

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { getTasks } from "@/lib/mongo";
import { toClient } from "@/lib/serialize";
import { MEMBERS } from "@/config/members";

export const dynamic = "force-dynamic";

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// POST /api/tasks/[id]/comments — add a comment posted "as" a member.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const body = await request.json();
    const text = (body.text || "").trim();
    const author = body.author || "";

    if (!text) {
      return NextResponse.json(
        { error: "Comment cannot be empty." },
        { status: 400 }
      );
    }
    if (!MEMBERS.includes(author)) {
      return NextResponse.json(
        { error: "Choose a member to reply as." },
        { status: 400 }
      );
    }

    const comment = {
      id: randomUUID(),
      author,
      text,
      createdAt: new Date().toISOString(),
    };

    const tasks = await getTasks();
    const doc = await tasks.findOneAndUpdate(
      { _id },
      {
        $push: { comments: comment },
        $set: { updatedAt: new Date().toISOString() },
      },
      { returnDocument: "after" }
    );

    if (!doc) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json(toClient(doc), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

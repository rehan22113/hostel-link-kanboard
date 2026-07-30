import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getTasks } from "@/lib/mongo";
import { toClient } from "@/lib/serialize";

export const dynamic = "force-dynamic";

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// DELETE /api/tasks/[id]/comments/[commentId] — remove a comment.
export async function DELETE(request, { params }) {
  try {
    const { id, commentId } = await params;
    const _id = parseId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const tasks = await getTasks();
    const doc = await tasks.findOneAndUpdate(
      { _id },
      {
        $pull: { comments: { id: commentId } },
        $set: { updatedAt: new Date().toISOString() },
      },
      { returnDocument: "after" }
    );

    if (!doc) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json(toClient(doc));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

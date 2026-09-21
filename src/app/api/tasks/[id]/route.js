import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getTasks } from "@/lib/mongo";
import { toClient } from "@/lib/serialize";
import { COLUMN_IDS } from "@/config/columns";

export const dynamic = "force-dynamic";

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// PATCH /api/tasks/[id] — update any subset of fields and/or move the card.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const body = await request.json();
    const update = {};

    if (body.title !== undefined) {
      const title = (body.title || "").trim();
      if (!title) {
        return NextResponse.json(
          { error: "Title cannot be empty." },
          { status: 400 }
        );
      }
      update.title = title;
    }
    if (body.description !== undefined)
      update.description = (body.description || "").trim();
    if (body.assignee !== undefined) update.assignee = body.assignee || "";
    if (body.deadline !== undefined) update.deadline = body.deadline || null;
    if (body.status !== undefined) {
      if (!COLUMN_IDS.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      update.status = body.status;
    }
    if (body.order !== undefined) update.order = body.order;

    update.updatedAt = new Date().toISOString();

    const tasks = await getTasks();

    // If the card is changing columns, append a move-history entry recording
    // where it went and who moved it. `body.by` is informational only — it is
    // never written to the task itself, just into the history entry.
    let historyPush = null;
    if (update.status !== undefined) {
      const current = await tasks.findOne(
        { _id },
        { projection: { status: 1 } }
      );
      if (current && current.status !== update.status) {
        historyPush = {
          from: current.status,
          to: update.status,
          at: update.updatedAt,
          by: typeof body.by === "string" ? body.by : "",
        };
      }
    }

    const mongoUpdate = { $set: update };
    if (historyPush) mongoUpdate.$push = { history: historyPush };

    const doc = await tasks.findOneAndUpdate({ _id }, mongoUpdate, {
      returnDocument: "after",
    });

    if (!doc) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json(toClient(doc));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const tasks = await getTasks();
    const result = await tasks.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

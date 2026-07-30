import { NextResponse } from "next/server";
import { getTasks } from "@/lib/mongo";
import { toClient } from "@/lib/serialize";
import { COLUMN_IDS } from "@/config/columns";

// Always run on the server, never statically cached.
export const dynamic = "force-dynamic";

// GET /api/tasks — all tasks, ordered by column then position within column.
export async function GET() {
  try {
    const tasks = await getTasks();
    const docs = await tasks
      .find({})
      .sort({ status: 1, order: 1 })
      .toArray();
    return NextResponse.json(docs.map(toClient));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/tasks — create a task.
export async function POST(request) {
  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const status = body.status || "backlog";
    if (!COLUMN_IDS.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const tasks = await getTasks();

    // Place the new card at the bottom of its column.
    const last = await tasks
      .find({ status })
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = last.length ? last[0].order + 1 : 0;

    const now = new Date().toISOString();
    const doc = {
      title,
      description: (body.description || "").trim(),
      assignee: body.assignee || "",
      deadline: body.deadline || null,
      status,
      order,
      createdAt: now,
      updatedAt: now,
    };

    const result = await tasks.insertOne(doc);
    return NextResponse.json(
      toClient({ _id: result.insertedId, ...doc }),
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

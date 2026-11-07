import type { HydratedDocument, Types } from "mongoose";
import type { IComment } from "../models/comment.js";
import { User } from "../models/index.js";

export async function toCommentDtos(
  comments: HydratedDocument<IComment>[],
  organizationId: Types.ObjectId,
) {
  const ids = [...new Set(comments.map((c) => String(c.authorId)))];
  const users =
    ids.length > 0
      ? await User.find({ _id: { $in: ids }, organizationId }).select("name role")
      : [];
  const byId = new Map(users.map((u) => [String(u._id), u]));

  return comments.map((c) => {
    const author = byId.get(String(c.authorId));
    return {
      id: String(c._id),
      ticketId: String(c.ticketId),
      body: c.body,
      author: {
        id: String(c.authorId),
        name: author?.name ?? "Removed user",
        role: author?.role ?? null,
      },
      createdAt: c.createdAt,
    };
  });
}

export async function toCommentDto(comment: HydratedDocument<IComment>) {
  const [dto] = await toCommentDtos([comment], comment.organizationId);
  return dto!;
}

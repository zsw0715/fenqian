"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Mars, Pencil, Plus, Trash2, Venus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";

const PAGE_SIZE = 6;
const COL_SIZE = 3;

type Student = { id: string; name: string; gender: string };

function StudentColumn({
  data,
  globalIndex,
  onDelete,
  onEdit,
}: {
  data: Student[];
  globalIndex: number;
  onDelete: (student: Student) => void;
  onEdit: (student: Student) => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="grid grid-cols-[32px_1fr_60px] md:grid-cols-[40px_1fr_1fr_80px] px-3 md:px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">#</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
        <span className="hidden md:block text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Edit</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {data.map((student, idx) => (
          <li
            key={student.id}
            className="group grid grid-cols-[32px_1fr_60px] md:grid-cols-[40px_1fr_1fr_80px] items-center px-3 md:px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-400 font-mono">{globalIndex + idx + 1}</span>
            <span className="text-sm font-medium text-gray-900 truncate pr-4">{student.name}</span>
            <span className="hidden md:flex text-sm text-gray-500 truncate pr-4 items-center gap-1">
              {student.gender === "male" ? (
                <><Mars size={12} className="text-blue-500" /> 男</>
              ) : (
                <><Venus size={12} className="text-pink-500" /> 女</>
              )}
            </span>
            <div className="flex justify-end gap-0.5">
              <button
                onClick={() => onEdit(student)}
                className="md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
              {/* <button
                onClick={() => onDelete(student)}
                className="md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button> */}
            </div>
          </li>
        ))}
        {data.length < COL_SIZE &&
          Array.from({ length: COL_SIZE - data.length }).map((_, i) => (
            <li key={`empty-${i}`} className="grid grid-cols-[32px_1fr_60px] md:grid-cols-[40px_1fr_1fr_80px] h-[47px] items-center px-3 md:px-4 py-3">
              <span className="text-sm text-white"></span>
              <span className="text-sm text-white"></span>
              <span />
            </li>
          ))}
      </ul>
    </div>
  );
}

export default function StudentList() {
  const [page, setPage] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState("male");
  const [newPassword, setNewPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState("male");
  const [editPassword, setEditPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchStudents = useCallback(async (p: number) => {
    try {
      const res = await api.get("/api/auth/list_all_students", {
        params: { page: p, page_size: PAGE_SIZE },
      });
      setStudents(res.data.items);
      setTotal(res.data.total);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStudents(page);
  }, [page, fetchStudents]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
    //   await api.delete(`/api/auth/delete_student?student_id=${deleteTarget.id}`);
      toast.success(`已删除 ${deleteTarget.name}`);
      setDeleteTarget(null);
      fetchStudents(page);
    } catch {
      toast.error("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error("请输入学生姓名"); return; }
    if (!newPassword) { toast.error("请输入密码"); return; }
    setAdding(true);
    try {
      await api.post("/api/auth/register", {
        username: newName.trim(),
        password: newPassword,
        gender: newGender,
        user_identity: "student",
      });
      toast.success(`已添加 ${newName.trim()}`);
      setAddOpen(false);
      setNewName("");
      setNewPassword("");
      setNewGender("male");
      fetchStudents(0);
      setPage(0);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "添加失败");
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (student: Student) => {
    setEditTarget(student);
    setEditName(student.name);
    setEditGender(student.gender);
    setEditPassword("");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editName.trim()) { toast.error("请输入学生姓名"); return; }
    setEditing(true);
    try {
      await api.put("/api/auth/update_student", {
        student_id: editTarget.id,
        username: editName.trim() !== editTarget.name ? editName.trim() : undefined,
        gender: editGender !== editTarget.gender ? editGender : undefined,
        password: editPassword || undefined,
      });
      toast.success(`已更新 ${editName.trim()}`);
      setEditTarget(null);
      fetchStudents(page);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "更新失败");
    } finally {
      setEditing(false);
    }
  };

  const left = students.slice(0, COL_SIZE);
  const right = students.slice(COL_SIZE);

  return (
    <>
      <div className="bg-white rounded-none border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Students</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <span className="text-xs text-gray-500 font-mono">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                  <Plus size={14} strokeWidth={2} />
                  Add
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加学生</DialogTitle>
                  <DialogDescription>填写学生信息以创建账号</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-foreground">姓名</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="请输入学生姓名"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-foreground">性别</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewGender("male")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm transition-colors ${
                          newGender === "male"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Mars size={14} /> 男
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewGender("female")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm transition-colors ${
                          newGender === "female"
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Venus size={14} /> 女
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-foreground">密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" size="default" disabled={adding}>取消</Button>
                  </DialogClose>
                  <Button onClick={handleAdd} disabled={adding}>
                    {adding ? "添加中..." : "添加"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog> */}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:divide-x md:divide-gray-100">
          <StudentColumn data={left} globalIndex={page * PAGE_SIZE} onDelete={setDeleteTarget} onEdit={openEdit} />
          <StudentColumn data={right} globalIndex={page * PAGE_SIZE + COL_SIZE} onDelete={setDeleteTarget} onEdit={openEdit} />
        </div>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑学生</DialogTitle>
            <DialogDescription>修改 {editTarget?.name} 的信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground">姓名</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div> */}
            {/* <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground">性别</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditGender("male")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm transition-colors ${
                    editGender === "male"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Mars size={14} /> 男
                </button>
                <button
                  type="button"
                  onClick={() => setEditGender("female")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-sm transition-colors ${
                    editGender === "female"
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Venus size={14} /> 女
                </button>
              </div>
            </div> */}
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground">新密码（留空则不修改）</label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="留空则不修改"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="default" disabled={editing}>取消</Button>
            </DialogClose>
            <Button onClick={handleEdit} disabled={editing}>
              {editing ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              真的要删除学生 <span className="font-semibold text-foreground">{deleteTarget?.name}</span> 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

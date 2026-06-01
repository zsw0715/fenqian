"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Mars, Pencil, Plus, Trash2, Venus } from "lucide-react";
import api from "@/utils/api";

const PAGE_SIZE = 10;
const COL_SIZE = 5;

type Student = { id: string; name: string; gender: string };

function StudentColumn({ data, globalIndex }: { data: Student[]; globalIndex: number }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="grid grid-cols-[40px_1fr_1fr_80px] px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">#</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Edit</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {data.map((student, idx) => (
          <li
            key={student.id}
            className="group grid grid-cols-[40px_1fr_1fr_80px] items-center px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-400 font-mono">{globalIndex + idx + 1}</span>
            <span className="text-sm font-medium text-gray-900 truncate pr-4">{student.name}</span>
            <span className="text-sm text-gray-500 truncate pr-4 flex items-center gap-1">
              {student.gender === "male" ? (
                <><Mars size={12} className="text-blue-500" /> 男</>
              ) : (
                <><Venus size={12} className="text-pink-500" /> 女</>
              )}
            </span>
            <div className="flex justify-end">
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                <Pencil size={14} strokeWidth={2} />
              </button>
            </div>
          </li>
        ))}
        {data.length < COL_SIZE &&
          Array.from({ length: COL_SIZE - data.length }).map((_, i) => (
            <li key={`empty-${i}`} className="grid grid-cols-[40px_1fr_1fr_80px] h-[47px] items-center px-4 py-3">
              <span className="text-sm text-white"></span>
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

  const left = students.slice(0, COL_SIZE);
  const right = students.slice(COL_SIZE);

  return (
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
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
            <Plus size={14} strokeWidth={2} />
            Add
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors">
            <Trash2 size={14} strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>

      <div className="flex divide-x divide-gray-100">
        <StudentColumn data={left} globalIndex={page * PAGE_SIZE} />
        <StudentColumn data={right} globalIndex={page * PAGE_SIZE + COL_SIZE} />
      </div>
    </div>
  );
}

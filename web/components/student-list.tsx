"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

const students = [
  { id: 1, name: "ShenweiZhang", gender: "Male", status: "Active" },
  { id: 2, name: "李四", gender: "Female", status: "Active" },
  { id: 3, name: "王五", gender: "Male", status: "Inactive" },
  { id: 4, name: "赵六", gender: "Female", status: "Active" },
  { id: 5, name: "孙七", gender: "Male", status: "Active" },
  { id: 6, name: "周八", gender: "Female", status: "Inactive" },
  { id: 7, name: "吴九", gender: "Male", status: "Active" },
];

function StudentTable({ data, startIndex }: { data: typeof students; startIndex: number }) {
  return (
    <div className="flex-1 min-w-0">
      {/* Table Header */}
      <div className="grid grid-cols-[40px_1fr_1fr_80px] px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">#</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Edit</span>
      </div>
      {/* Table Body */}
      <ul className="divide-y divide-gray-100">
        {data.map((student, idx) => (
          <li
            key={student.id}
            className="group grid grid-cols-[40px_1fr_1fr_80px] items-center px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-400 font-mono">{startIndex + idx + 1}</span>
            <span className="text-sm font-medium text-gray-900 truncate pr-4">{student.name}</span>
            <span className="text-sm text-gray-500 truncate pr-4">{student.gender}</span>
            <div className="flex justify-end">
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded">
                <Pencil size={14} strokeWidth={2} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StudentList() {
  const mid = Math.ceil(students.length / 2);
  const left = students.slice(0, mid);
  const right = students.slice(mid);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Students</h2>
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

      {/* Two Column Layout */}
      <div className="flex divide-x divide-gray-100">
        <StudentTable data={left} startIndex={0} />
        <StudentTable data={right} startIndex={mid} />
      </div>
    </div>
  );
}

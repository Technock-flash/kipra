'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Pencil, Trash2 } from 'lucide-react';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  isLeader: boolean;
  department?: { id: string; name: string } | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const preferredDepartmentOrder = [
  'Praise and Worship',
  'Media Team',
  'Hosting and Decorations',
  'Intercessors',
  'Ushers',
];

const departmentAliases: Record<string, string> = {
  'praise & worship': 'Praise and Worship',
  'praise and worship': 'Praise and Worship',
  'media & technical': 'Media Team',
  'media team': 'Media Team',
  ushering: 'Ushers',
  ushers: 'Ushers',
  intercessors: 'Intercessors',
  'hosting and decorations': 'Hosting and Decorations',
};

export default function MembersPage() {
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    departmentId: '',
    isLeader: false,
  });
  const [editForm, setEditForm] = useState<typeof form | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersRes, deptRes] = await Promise.all([
          api.get('/members?limit=20&page=1'),
          api.get('/leadership/departments?limit=100&page=1'),
        ]);
        setMembers(membersRes.data.data ?? []);
        const rawDepartments: DepartmentOption[] = deptRes.data.data ?? [];
        const aliasMap = new Map<string, DepartmentOption>();
        for (const department of rawDepartments) {
          const normalizedName =
            departmentAliases[department.name.trim().toLowerCase()] || department.name;
          if (!aliasMap.has(normalizedName)) {
            aliasMap.set(normalizedName, { id: department.id, name: normalizedName });
          }
        }
        const ordered = Array.from(aliasMap.values()).sort((a, b) => {
          const aIndex = preferredDepartmentOrder.indexOf(a.name);
          const bIndex = preferredDepartmentOrder.indexOf(b.name);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        setDepartments(ordered);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const reloadMembers = async () => {
    const response = await api.get('/members?limit=20&page=1');
    setMembers(response.data.data ?? []);
  };

  const submitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('member:create')) return;
    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/members', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        gender: form.gender || null,
        departmentId: form.departmentId || null,
        isLeader: form.isLeader,
      });
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        departmentId: '',
        isLeader: false,
      });
      await reloadMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (member: Member) => {
    if (!hasPermission('member:update')) return;
    setEditMemberId(member.id);
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || '',
      departmentId: member.department?.id || '',
      isLeader: member.isLeader,
    });
  };

  const closeEdit = () => {
    setEditMemberId(null);
    setEditForm(null);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMemberId || !editForm || !hasPermission('member:update')) return;
    setSavingEdit(true);
    setError('');
    try {
      await api.put(`/members/${editMemberId}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email || null,
        phone: editForm.phone || null,
        gender: editForm.gender || null,
        departmentId: editForm.departmentId || null,
        isLeader: editForm.isLeader,
      });
      closeEdit();
      await reloadMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!hasPermission('member:delete')) return;
    if (
      !window.confirm(
        `Remove ${member.firstName} ${member.lastName} from the directory? This can be restored by an administrator from deleted records.`
      )
    ) {
      return;
    }
    setDeletingId(member.id);
    setError('');
    try {
      await api.delete(`/members/${member.id}`);
      if (editMemberId === member.id) closeEdit();
      await reloadMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete member');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground">Manage church member records and profiles.</p>
      </div>

      {hasPermission('member:create') ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Member</CardTitle>
            <CardDescription>Create a new member profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitMember}>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <select
                id="departmentId"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.departmentId}
                onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
              >
                <option value="">No department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="isLeader"
                type="checkbox"
                checked={form.isLeader}
                onChange={(e) => setForm((prev) => ({ ...prev, isLeader: e.target.checked }))}
              />
              <Label htmlFor="isLeader">Mark as leader</Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create Member'}
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Member Management</CardTitle>
            <CardDescription>You have view-only access for member records.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {hasPermission('member:update') && editForm && (
        <Card>
          <CardHeader>
            <CardTitle>Edit member</CardTitle>
            <CardDescription>Update this profile and save changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitEdit}>
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, firstName: e.target.value } : null))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, lastName: e.target.value } : null))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGender">Gender</Label>
                <select
                  id="editGender"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={editForm.gender}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, gender: e.target.value } : null))}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartmentId">Department</Label>
                <select
                  id="editDepartmentId"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, departmentId: e.target.value } : null))}
                >
                  <option value="">No department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  id="editIsLeader"
                  type="checkbox"
                  checked={editForm.isLeader}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, isLeader: e.target.checked } : null))}
                />
                <Label htmlFor="editIsLeader">Mark as leader</Label>
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </Button>
                <Button type="button" variant="outline" onClick={closeEdit} disabled={savingEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Member Directory</CardTitle>
          <CardDescription>Showing recent active members.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading members...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Department</th>
                    <th className="py-2 pr-4">Role</th>
                    {(hasPermission('member:update') || hasPermission('member:delete')) && (
                      <th className="py-2 pr-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{member.firstName} {member.lastName}</td>
                      <td className="py-2 pr-4">{member.email || '-'}</td>
                      <td className="py-2 pr-4">{member.phone || '-'}</td>
                      <td className="py-2 pr-4">{member.department?.name || '-'}</td>
                      <td className="py-2 pr-4">{member.isLeader ? 'Leader' : 'Member'}</td>
                      {(hasPermission('member:update') || hasPermission('member:delete')) && (
                        <td className="py-2 pr-0 text-right">
                          <div className="flex justify-end gap-1">
                            {hasPermission('member:update') && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Edit member"
                                onClick={() => openEdit(member)}
                                disabled={deletingId === member.id}
                                aria-label={`Edit ${member.firstName} ${member.lastName}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission('member:delete') && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete member"
                                onClick={() => handleDelete(member)}
                                disabled={deletingId === member.id}
                                aria-label={`Delete ${member.firstName} ${member.lastName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground py-3">No members found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Calendar, User, AlignLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STATUS_COLORS = {
  'todo': 'bg-slate-100 text-slate-800 border-slate-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'blocked': 'bg-red-100 text-red-800 border-red-200'
};

const PRIORITY_COLORS = {
  'low': 'bg-slate-100 text-slate-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800',
  'critical': 'bg-red-100 text-red-800'
};

export default function TaskManagementTab({ selectedProduct }) {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 'medium', due_date: '', owner_name: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_projects')
        .select('*')
        .eq('product_id', selectedProduct)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, toast]);

  const loadTasks = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from('tasks_ops')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load tasks", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadProjects();
    setSelectedProject(null);
    setTasks([]);
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject.id);
    }
  }, [selectedProject, loadTasks]);

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from('task_projects').insert({
        product_id: selectedProduct,
        project_name: newProject.name,
        project_description: newProject.description,
        created_by: session?.user?.id
      }).select().single();
      if (error) throw error;
      setProjects([data, ...projects]);
      setNewProject({ name: '', description: '' });
      setShowProjectForm(false);
      toast({ title: "Project created" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to create project", variant: "destructive" });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.name || !selectedProject) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from('tasks_ops').insert({
        project_id: selectedProject.id,
        product_id: selectedProduct,
        task_name: newTask.name,
        task_description: newTask.description,
        priority: newTask.priority,
        owner_name: newTask.owner_name,
        due_date: newTask.due_date || null,
        created_by: session?.user?.id
      }).select().single();
      if (error) throw error;
      setTasks([data, ...tasks]);
      setNewTask({ name: '', description: '', priority: 'medium', due_date: '', owner_name: '' });
      setShowTaskForm(false);
      toast({ title: "Task created" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const { error } = await supabase.from('tasks_ops').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase.from('tasks_ops').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Task deleted" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete task", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" /></div>;
  }

  return (
    <div className="space-y-6">
      {!selectedProject ? (
        <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Projects</h3>
            <Button onClick={() => setShowProjectForm(!showProjectForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </div>

          {showProjectForm && (
            <div className="mb-6 p-4 bg-[hsl(var(--stone-light))] rounded-lg border border-[hsl(var(--border))] space-y-4">
              <div>
                <Label>Project Name</Label>
                <Input value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateProject}>Create</Button>
                <Button variant="outline" onClick={() => setShowProjectForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <p className="text-sm opacity-60 col-span-full">No projects found. Create one to get started.</p>
            ) : (
              projects.map(p => (
                <div key={p.id} 
                     onClick={() => setSelectedProject(p)}
                     className="p-4 border border-[hsl(var(--border))] rounded-lg cursor-pointer hover:border-[hsl(var(--terracotta))] transition-colors">
                  <h4 className="font-heading text-lg mb-2">{p.project_name}</h4>
                  <p className="text-sm opacity-70 line-clamp-2">{p.project_description || 'No description'}</p>
                  <div className="mt-4 flex justify-between items-center text-xs opacity-60 font-mono-num">
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    <span className="capitalize">{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedProject(null)}>Back to Projects</Button>
            <div>
              <h2 className="font-heading text-2xl text-[hsl(var(--cinder))]">{selectedProject.project_name}</h2>
              <p className="text-sm opacity-70">{selectedProject.project_description}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Tasks</h3>
              <Button onClick={() => setShowTaskForm(!showTaskForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </div>

            {showTaskForm && (
              <div className="mb-6 p-4 bg-[hsl(var(--stone-light))] rounded-lg border border-[hsl(var(--border))] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Task Name</Label>
                    <Input value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="mt-1" />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={newTask.priority} onValueChange={v => setNewTask({...newTask, priority: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Owner Name</Label>
                    <Input value={newTask.owner_name} onChange={e => setNewTask({...newTask, owner_name: e.target.value})} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreateTask}>Create Task</Button>
                  <Button variant="outline" onClick={() => setShowTaskForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm opacity-60">No tasks in this project.</p>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className="flex items-start justify-between p-4 border border-[hsl(var(--border))] rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-[hsl(var(--cinder))]">{t.task_name}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_COLORS[t.priority]}`}>
                          {t.priority}
                        </span>
                      </div>
                      {t.task_description && (
                        <div className="text-sm opacity-70 flex items-start gap-2">
                          <AlignLeft className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p>{t.task_description}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs opacity-60 mt-2 font-mono-num">
                        {t.owner_name && (
                          <div className="flex items-center gap-1"><User className="w-3 h-3" /> {t.owner_name}</div>
                        )}
                        {t.due_date && (
                          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {t.due_date}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Select value={t.status} onValueChange={(v) => updateTaskStatus(t.id, v)}>
                        <SelectTrigger className={`w-[130px] h-8 text-xs border ${STATUS_COLORS[t.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteTask(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
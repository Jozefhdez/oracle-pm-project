import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import {
  useTask,
  useTaskHistory,
  useTaskWorkLogs,
  useReassignTask,
} from '../models/hooks/useTasks';
import { useMembers } from '../models/hooks/useMembers';
import { useActiveProject } from '../models/ProjectContext';
import TaskDetailView from '../views/tasks/TaskDetailView';

export default function TaskDetailController() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useActiveProject();

  const { data: task, isLoading } = useTask(taskId);
  const { data: history = [] } = useTaskHistory(taskId);
  const { data: logs = [] } = useTaskWorkLogs(taskId);
  const { data: members = [] } = useMembers(activeProject?.id);
  const reassignTask = useReassignTask(taskId);

  if (isLoading) return <CircularProgress />;

  return (
    <TaskDetailView
      task={task}
      history={history}
      logs={logs}
      members={members}
      onReassign={({ assigneeId, user }) => reassignTask.mutate({ assigneeId, user })}
      onBack={() => navigate(-1)}
    />
  );
}

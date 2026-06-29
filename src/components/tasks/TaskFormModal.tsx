import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskInput } from "@/lib/validators";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Task,
  type PublicUser,
} from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskInput) => Promise<unknown>;
  members: PublicUser[];
  task?: Task | null;
  defaultStatus?: string;
}

const statusOptions = TASK_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));
const priorityOptions = TASK_PRIORITIES.map((p) => ({
  value: p,
  label: PRIORITY_LABELS[p],
}));

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  members,
  task,
  defaultStatus = "TODO",
}: TaskFormModalProps) {
  const isEdit = Boolean(task);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? defaultStatus,
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
      assigneeId: task?.assigneeId ?? "",
      labels: task?.labels ?? [],
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      dueDate: values.dueDate || undefined,
      assigneeId: values.assigneeId || undefined,
    });
    reset();
    onClose();
  });

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit task" : "New task"}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isSubmitting}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" htmlFor="title" error={errors.title?.message} required>
          <Input id="title" placeholder="What needs to be done?" {...register("title")} />
        </Field>
        <Field
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
        >
          <Textarea id="description" {...register("description")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status" htmlFor="status">
            <Select id="status" options={statusOptions} {...register("status")} />
          </Field>
          <Field label="Priority" htmlFor="priority">
            <Select id="priority" options={priorityOptions} {...register("priority")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee" htmlFor="assigneeId">
            <Select
              id="assigneeId"
              options={assigneeOptions}
              {...register("assigneeId")}
            />
          </Field>
          <Field label="Due date" htmlFor="dueDate">
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectInput } from "@/lib/validators";
import type { Project } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectInput) => Promise<unknown>;
  project?: Project | null;
}

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  project,
}: ProjectFormModalProps) {
  const isEdit = Boolean(project);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    values: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      dueDate: toDateInput(project?.dueDate),
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({ ...values, dueDate: values.dueDate || undefined });
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit project" : "New project"}
      description={
        isEdit ? "Update the project details." : "Create a project to group your tasks."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isSubmitting}>
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" placeholder="e.g. Marketing site" {...register("name")} />
        </Field>
        <Field
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
        >
          <Textarea
            id="description"
            placeholder="What is this project about?"
            {...register("description")}
          />
        </Field>
        <Field label="Due date" htmlFor="dueDate" error={errors.dueDate?.message}>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </Field>
      </form>
    </Modal>
  );
}

"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui";
import { Button } from "@/Components/atoms/Button";
import { EmptyState } from "@/Components/organisms/EmptyState";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import type { ScreeningFormListItem } from "@/types/screeningForm";

interface FormBuilderListProps {
  forms: ScreeningFormListItem[];
  loading?: boolean;
  onCreate: () => void;
  onEdit: (formId: string) => void;
  onDelete: (formId: string) => void;
}

export function FormBuilderList({
  forms,
  loading = false,
  onCreate,
  onEdit,
  onDelete,
}: FormBuilderListProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Screening forms</CardTitle>
          <CardDescription>
            Reusable questionnaire templates. Assign them to one or more jobs
            when creating or editing a job posting.
          </CardDescription>
        </div>
        <Button onClick={onCreate}>Create form</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSection />
        ) : forms.length === 0 ? (
          <EmptyState message="No screening forms yet. Create a template, then assign it from a job posting.">
            <Button onClick={onCreate}>Create form</Button>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Linked jobs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{form.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.is_active ? "success" : "secondary"}>
                      {form.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{form.question_count}</Badge>
                  </TableCell>
                  <TableCell>{form.linked_job_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(form.id)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(form.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4 text-red-600" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Calendar, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Copy,
  BookOpen
} from "lucide-react";
import type { SemesterPlanWithCourses, Course } from "@shared/schema";

export default function Planner() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addCourseDialogOpen, setAddCourseDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [planName, setPlanName] = useState("");
  const [planSemester, setPlanSemester] = useState("");
  const [planYear, setPlanYear] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [crn, setCrn] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [schedule, setSchedule] = useState("");
  const { toast } = useToast();

  const { data: plans, isLoading: loadingPlans } = useQuery<SemesterPlanWithCourses[]>({
    queryKey: ["/api/plans"],
  });

  const { data: availableCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses/eligible"],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: { name: string; semester: string; year: number }) => {
      return apiRequest("POST", "/api/plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      setCreateDialogOpen(false);
      setPlanName("");
      setPlanSemester("");
      setPlanYear("");
      toast({ title: "Plan created!", description: "Your semester plan has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create plan.", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plan deleted", description: "The plan has been removed." });
    },
  });

  const setActivePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/plans/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plan activated", description: "This is now your active plan." });
    },
  });

  const addCourseToPlanMutation = useMutation({
    mutationFn: async (data: { planId: number; courseId: number; crn?: string; professorName?: string; schedule?: string }) => {
      return apiRequest("POST", `/api/plans/${data.planId}/courses`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      setAddCourseDialogOpen(false);
      setSelectedCourseId("");
      setCrn("");
      setProfessorName("");
      setSchedule("");
      toast({ title: "Course added!", description: "The course has been added to your plan." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add course.", variant: "destructive" });
    },
  });

  const removeCourseFromPlanMutation = useMutation({
    mutationFn: async (data: { planId: number; planCourseId: number }) => {
      return apiRequest("DELETE", `/api/plans/${data.planId}/courses/${data.planCourseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Course removed", description: "The course has been removed from the plan." });
    },
  });

  const handleCreatePlan = () => {
    if (!planName || !planSemester || !planYear) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    createPlanMutation.mutate({
      name: planName,
      semester: planSemester,
      year: parseInt(planYear),
    });
  };

  const handleAddCourse = () => {
    if (!selectedPlanId || !selectedCourseId) {
      toast({ title: "Missing fields", description: "Please select a course.", variant: "destructive" });
      return;
    }
    addCourseToPlanMutation.mutate({
      planId: selectedPlanId,
      courseId: parseInt(selectedCourseId),
      crn: crn || undefined,
      professorName: professorName || undefined,
      schedule: schedule || undefined,
    });
  };

  const getDifficultyLabel = (score: number) => {
    if (score <= 2) return { label: "Light", color: "text-chart-2" };
    if (score <= 3) return { label: "Moderate", color: "text-chart-4" };
    return { label: "Heavy", color: "text-destructive" };
  };

  const copyCRNs = (plan: SemesterPlanWithCourses) => {
    const crns = plan.courses.filter(c => c.crn).map(c => c.crn).join(", ");
    if (crns) {
      navigator.clipboard.writeText(crns);
      toast({ title: "CRNs copied!", description: "Course registration numbers copied to clipboard." });
    } else {
      toast({ title: "No CRNs", description: "Add CRNs to your courses first.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Semester Planner</h1>
          <p className="text-muted-foreground mt-1">
            Build and compare your term plans
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-plan">
              <Plus className="h-4 w-4" />
              Create New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Semester Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  placeholder="e.g., Option A - Morning Classes"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  data-testid="input-plan-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={planSemester} onValueChange={setPlanSemester}>
                    <SelectTrigger data-testid="select-plan-semester">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Fall", "Winter", "Spring", "Summer"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    placeholder="2026"
                    value={planYear}
                    onChange={(e) => setPlanYear(e.target.value)}
                    data-testid="input-plan-year"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreatePlan}
                disabled={createPlanMutation.isPending}
                data-testid="button-submit-plan"
              >
                {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingPlans ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map(plan => {
            const difficultyInfo = getDifficultyLabel(plan.difficultyScore);
            const isHeavy = plan.difficultyScore > 3 || plan.totalCredits > 18;
            
            return (
              <Card 
                key={plan.id} 
                className={plan.isActive ? "ring-2 ring-primary" : ""}
                data-testid={`plan-card-${plan.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {plan.isActive && (
                          <Badge className="bg-primary">Active</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {plan.semester} {plan.year}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyCRNs(plan)}
                        title="Copy CRNs"
                        data-testid={`button-copy-crns-${plan.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePlanMutation.mutate(plan.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{plan.totalCredits} credits</span>
                    </div>
                    <div className={`flex items-center gap-2 ${difficultyInfo.color}`}>
                      <span className="text-sm">{difficultyInfo.label} workload</span>
                    </div>
                  </div>

                  {isHeavy && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-chart-4/10 text-chart-4">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="text-sm">
                        This plan may be challenging. Consider spreading courses across terms.
                      </p>
                    </div>
                  )}

                  {plan.courses?.length > 0 ? (
                    <div className="space-y-2">
                      {plan.courses.map(pc => (
                        <div
                          key={pc.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pc.course.code}</span>
                              <Badge variant="outline" className="text-xs">{pc.course.credits} cr</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{pc.course.name}</p>
                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                              {pc.crn && <span>CRN: {pc.crn}</span>}
                              {pc.schedule && <span>{pc.schedule}</span>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCourseFromPlanMutation.mutate({ planId: plan.id, planCourseId: pc.id })}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            data-testid={`button-remove-course-${pc.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No courses added yet</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Dialog open={addCourseDialogOpen && selectedPlanId === plan.id} onOpenChange={(open) => {
                      setAddCourseDialogOpen(open);
                      if (open) setSelectedPlanId(plan.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 gap-2" data-testid={`button-add-course-to-plan-${plan.id}`}>
                          <Plus className="h-4 w-4" />
                          Add Course
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Course to Plan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Course</Label>
                            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                              <SelectTrigger data-testid="select-course-for-plan">
                                <SelectValue placeholder="Select a course" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCourses?.map(course => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.code} - {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>CRN (optional)</Label>
                            <Input
                              placeholder="e.g., 12345"
                              value={crn}
                              onChange={(e) => setCrn(e.target.value)}
                              data-testid="input-crn"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Professor (optional)</Label>
                            <Input
                              placeholder="e.g., Dr. Smith"
                              value={professorName}
                              onChange={(e) => setProfessorName(e.target.value)}
                              data-testid="input-professor"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Schedule (optional)</Label>
                            <Input
                              placeholder="e.g., MWF 10:00-11:00"
                              value={schedule}
                              onChange={(e) => setSchedule(e.target.value)}
                              data-testid="input-schedule"
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handleAddCourse}
                            disabled={addCourseToPlanMutation.isPending}
                            data-testid="button-submit-add-course"
                          >
                            {addCourseToPlanMutation.isPending ? "Adding..." : "Add to Plan"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {!plan.isActive && (
                      <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() => setActivePlanMutation.mutate(plan.id)}
                        data-testid={`button-activate-plan-${plan.id}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Set Active
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Semester Plans Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first semester plan to start organizing your courses and track CRNs for registration day.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-plan">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

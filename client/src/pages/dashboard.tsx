import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Clock
} from "lucide-react";
import type { Requirement, SemesterPlanWithCourses } from "@shared/schema";

export default function Dashboard() {
  const { data: requirements, isLoading: loadingReqs } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
  });

  const { data: plans, isLoading: loadingPlans } = useQuery<SemesterPlanWithCourses[]>({
    queryKey: ["/api/plans"],
  });

  const { data: stats, isLoading: loadingStats } = useQuery<{
    totalCredits: number;
    completedCredits: number;
    completedCourses: number;
    upcomingCourses: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const totalRequired = requirements?.reduce((acc, r) => acc + r.requiredCredits, 0) || 0;
  const totalCompleted = requirements?.reduce((acc, r) => acc + r.completedCredits, 0) || 0;
  const progressPercent = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

  const alerts = [
    {
      type: "warning" as const,
      message: "CP 312 has a heavy prereq chain — complete CP 264 and MA 200 first",
      icon: AlertTriangle,
    },
    {
      type: "info" as const,
      message: "Fall 2025 LORIS registration — confirm your plan with your faculty advisor",
      icon: Clock,
    },
  ];

  const activePlan = plans?.find(p => p.isActive);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Wilfrid Laurier University — Computer Science (Honours BSc)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{progressPercent}%</div>
                <p className="text-xs text-muted-foreground">
                  {totalCompleted} of {totalRequired} credits
                </p>
                <Progress value={progressPercent} className="mt-2 h-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.completedCourses || 0}</div>
                <p className="text-xs text-muted-foreground">Courses finished</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Planned Courses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activePlan?.courses?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {activePlan ? `${activePlan.semester} ${activePlan.year}` : "No active plan"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Credits This Term</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activePlan?.totalCredits || 0}</div>
                <p className="text-xs text-muted-foreground">Planned credits</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Requirements Progress
            </CardTitle>
            <CardDescription>Track your degree requirements by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingReqs ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : requirements && requirements.length > 0 ? (
              requirements.map((req) => {
                const percent = req.requiredCredits > 0 
                  ? Math.round((req.completedCredits / req.requiredCredits) * 100)
                  : 0;
                const isComplete = req.completedCredits >= req.requiredCredits;
                
                return (
                  <div key={req.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{req.category}</span>
                        {isComplete && (
                          <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
                            Complete
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {req.completedCredits}/{req.requiredCredits} credits
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    {req.description && (
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No requirements set up yet</p>
                <p className="text-sm">Add your degree requirements to track progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Reminders
            </CardTitle>
            <CardDescription>Important notices for your planning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === "warning" 
                    ? "bg-chart-4/10 text-chart-4" 
                    : "bg-primary/10 text-primary"
                }`}
              >
                <alert.icon className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {activePlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Active Plan: {activePlan.name}
            </CardTitle>
            <CardDescription>
              {activePlan.semester} {activePlan.year} - {activePlan.totalCredits} credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activePlan.courses?.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activePlan.courses.map((pc) => (
                  <div
                    key={pc.id}
                    className="p-4 rounded-lg border border-border bg-muted/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pc.course.code}</span>
                      <Badge variant="outline">{pc.course.credits} cr</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {pc.course.name}
                    </p>
                    {pc.crn && (
                      <p className="text-xs text-muted-foreground">CRN: {pc.crn}</p>
                    )}
                    {pc.schedule && (
                      <p className="text-xs text-muted-foreground">{pc.schedule}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No courses added to this plan yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

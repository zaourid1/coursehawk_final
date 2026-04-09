import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Lock,
  Unlock
} from "lucide-react";
import type { CourseWithEligibility } from "@shared/schema";

export default function Eligibility() {
  const { data: courses, isLoading } = useQuery<CourseWithEligibility[]>({
    queryKey: ["/api/courses"],
  });

  const eligibleCourses = courses?.filter(c => c.isEligible && !c.isCompleted) || [];
  const blockedCourses = courses?.filter(c => !c.isEligible && !c.isCompleted) || [];
  const completedCourses = courses?.filter(c => c.isCompleted) || [];

  const groupedEligible = eligibleCourses.reduce((acc, course) => {
    const cat = course.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<string, CourseWithEligibility[]>);

  const groupedBlocked = blockedCourses.reduce((acc, course) => {
    const cat = course.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<string, CourseWithEligibility[]>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Eligibility Report</h1>
        <p className="text-muted-foreground mt-1">
          View which courses you can take and what's blocking you from others
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Eligible Courses</CardTitle>
            <Unlock className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{eligibleCourses.length}</div>
            <p className="text-xs text-muted-foreground">Ready to take next term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Courses</CardTitle>
            <Lock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{blockedCourses.length}</div>
            <p className="text-xs text-muted-foreground">Missing prerequisites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCourses.length}</div>
            <p className="text-xs text-muted-foreground">Courses finished</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="eligible" className="space-y-6">
          <TabsList>
            <TabsTrigger value="eligible" className="gap-2" data-testid="tab-eligible">
              <CheckCircle2 className="h-4 w-4" />
              Eligible ({eligibleCourses.length})
            </TabsTrigger>
            <TabsTrigger value="blocked" className="gap-2" data-testid="tab-blocked">
              <XCircle className="h-4 w-4" />
              Blocked ({blockedCourses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eligible" className="space-y-6">
            {Object.keys(groupedEligible).length > 0 ? (
              Object.entries(groupedEligible).map(([category, courses]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-chart-2" />
                      {category}
                    </CardTitle>
                    <CardDescription>
                      {courses.length} course{courses.length !== 1 ? "s" : ""} available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {courses.map(course => (
                        <div
                          key={course.id}
                          className="p-4 rounded-lg border border-chart-2/20 bg-chart-2/5 space-y-2"
                          data-testid={`eligible-course-${course.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{course.code}</span>
                            <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
                              {course.credits} credits
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.name}
                          </p>
                          {course.prerequisites && course.prerequisites.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-chart-2" />
                              <span>Prerequisites met</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Eligible Courses</h3>
                  <p className="text-muted-foreground">
                    Complete more prerequisites to unlock additional courses.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="blocked" className="space-y-6">
            {Object.keys(groupedBlocked).length > 0 ? (
              Object.entries(groupedBlocked).map(([category, courses]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      {category}
                    </CardTitle>
                    <CardDescription>
                      {courses.length} course{courses.length !== 1 ? "s" : ""} blocked
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courses.map(course => (
                        <div
                          key={course.id}
                          className="p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                          data-testid={`blocked-course-${course.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{course.code}</span>
                                <Badge variant="outline">{course.credits} credits</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {course.name}
                              </p>
                              {course.blockedBy && course.blockedBy.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    Missing Prerequisites:
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {course.blockedBy.map(prereq => (
                                      <div
                                        key={prereq}
                                        className="flex items-center gap-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-sm"
                                      >
                                        <Lock className="h-3 w-3" />
                                        {prereq}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {course.blockedBy && course.blockedBy.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                <strong>Path to unlock:</strong> Complete{" "}
                                {course.blockedBy.join(", ")}
                                <ArrowRight className="inline h-3 w-3 mx-1" />
                                {course.code}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-chart-2 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Blocked Courses</h3>
                  <p className="text-muted-foreground">
                    You have access to all remaining courses. Great job!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

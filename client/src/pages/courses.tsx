import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Plus,
  Lock,
  Unlock,
  Star
} from "lucide-react";
import type { Course, CourseWithEligibility, CompletedCourse } from "@shared/schema";

export default function Courses() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const { toast } = useToast();

  const { data: courses, isLoading: loadingCourses } = useQuery<CourseWithEligibility[]>({
    queryKey: ["/api/courses"],
  });

  const { data: completedCourses, isLoading: loadingCompleted } = useQuery<(CompletedCourse & { course: Course })[]>({
    queryKey: ["/api/completed-courses"],
  });

  const addCompletedMutation = useMutation({
    mutationFn: async (data: { courseId: number; grade: string; semester: string; year: number }) => {
      return apiRequest("POST", "/api/completed-courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/completed-courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setAddDialogOpen(false);
      setSelectedCourse(null);
      setGrade("");
      setSemester("");
      setYear("");
      toast({ title: "Course added!", description: "Your completed course has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add course. Please try again.", variant: "destructive" });
    },
  });

  const removeCompletedMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/completed-courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/completed-courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Course removed", description: "The course has been removed from your completed list." });
    },
  });

  const categories = courses ? Array.from(new Set(courses.map(c => c.category))) : [];

  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(search.toLowerCase()) ||
                         course.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const eligibleCourses = filteredCourses?.filter(c => c.isEligible && !c.isCompleted);
  const blockedCourses = filteredCourses?.filter(c => !c.isEligible && !c.isCompleted);

  const handleAddCourse = () => {
    if (!selectedCourse || !grade || !semester || !year) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    addCompletedMutation.mutate({
      courseId: selectedCourse.id,
      grade,
      semester,
      year: parseInt(year),
    });
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "text-chart-2";
    if (difficulty <= 3) return "text-chart-4";
    return "text-destructive";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Browse courses and track your completed credits
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-course">
              <Plus className="h-4 w-4" />
              Add Completed Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Completed Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select
                  value={selectedCourse?.id?.toString() || ""}
                  onValueChange={(val) => {
                    const course = courses?.find(c => c.id === parseInt(val));
                    setSelectedCourse(course || null);
                  }}
                >
                  <SelectTrigger data-testid="select-course">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.filter(c => !c.isCompleted).map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger data-testid="select-grade">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "P"].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger data-testid="select-semester">
                      <SelectValue placeholder="Semester" />
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
                    placeholder="2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    data-testid="input-year"
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddCourse}
                disabled={addCompletedMutation.isPending}
                data-testid="button-submit-course"
              >
                {addCompletedMutation.isPending ? "Adding..." : "Add Course"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-courses"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available" className="gap-2" data-testid="tab-available">
            <Unlock className="h-4 w-4" />
            Available ({eligibleCourses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="blocked" className="gap-2" data-testid="tab-blocked">
            <Lock className="h-4 w-4" />
            Blocked ({blockedCourses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2" data-testid="tab-completed">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedCourses?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          {loadingCourses ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : eligibleCourses && eligibleCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eligibleCourses.map(course => (
                <Card key={course.id} className="hover-elevate" data-testid={`course-card-${course.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{course.code}</CardTitle>
                        <CardDescription className="line-clamp-1">{course.name}</CardDescription>
                      </div>
                      <Badge variant="outline">{course.credits} cr</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{course.category}</Badge>
                      <div className={`flex items-center gap-1 text-sm ${getDifficultyColor(course.difficulty || 3)}`}>
                        <Star className="h-3 w-3" />
                        <span>Difficulty: {course.difficulty || 3}/5</span>
                      </div>
                    </div>
                    {course.prerequisites && course.prerequisites.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Prerequisites: {course.prerequisites.join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No available courses found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocked">
          {loadingCourses ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : blockedCourses && blockedCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blockedCourses.map(course => (
                <Card key={course.id} className="opacity-75" data-testid={`blocked-course-${course.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {course.code}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">{course.name}</CardDescription>
                      </div>
                      <Badge variant="outline">{course.credits} cr</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{course.category}</Badge>
                    </div>
                    {course.blockedBy && course.blockedBy.length > 0 && (
                      <div className="p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                        Missing: {course.blockedBy.join(", ")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Unlock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No blocked courses</p>
              <p className="text-sm">All remaining courses are available to you</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {loadingCompleted ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : completedCourses && completedCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedCourses.map(cc => (
                <Card key={cc.id} data-testid={`completed-course-${cc.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                          {cc.course.code}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">{cc.course.name}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
                        {cc.grade}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{cc.course.credits} credits</Badge>
                      <span className="text-sm text-muted-foreground">
                        {cc.semester} {cc.year}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeCompletedMutation.mutate(cc.id)}
                      disabled={removeCompletedMutation.isPending}
                      data-testid={`button-remove-${cc.id}`}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No completed courses yet</p>
              <p className="text-sm">Add your completed courses to track progress</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

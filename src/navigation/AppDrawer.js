import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SessionContext } from "../state/session";

// Import dashboard screens
import AdminDashboard from "../app/admin/AdminDashboard";
// Import TeacherDashboard screen
import TeacherDashboard from "../app/teacher/TeacherDashboard";
import ParentDashboard from "../app/parent/ParentDashboard";
// Import TeachersList and StudentsList screens
import TeachersList from "../app/common/TeachersList";
import StudentsList from "../app/common/StudentsList";
// Import TeacherSchedule screen
import TeacherSchedule from "../app/teacher/TeacherSchedule";
import TeacherScheduleScreen from "../app/teacher/TeacherScheduleScreen";
// Import Attendance screen
import Attendance from "../app/teacher/attendance";
// Import AttendanceResults screen
import AttendanceResults from "../app/teacher/AttendanceResults";
// Import HomeworkAssignment screen
import HomeworkAssignment from "../app/teacher/HomeworkAssignment";
// Import HomeworksGivenList screen
import HomeworksGivenList from "../app/teacher/HomeworksGivenList";
// Import HomeworkGivenDetail screen
import HomeworkGivenDetail from "../app/teacher/HomeworkGivenDetail";
// Import StudentHomeworkList screen
import StudentHomeworkList from "../app/parent/StudentHomeworkList";
// Import StudentHomeworkDetail screen
import StudentHomeworkDetail from "../app/parent/StudentHomeworkDetail";
// Import StudentAbsences screen
import StudentAbsences from "../app/parent/StudentAbsences";
// Import StudentScheduleScreen
import StudentScheduleScreen from "../app/student/StudentScheduleScreen";
// Import ExamAdd screen
import ExamAdd from "../app/teacher/ExamAdd";
// Import ExamsList screen
import ExamsList from "../app/teacher/ExamsList";
// Import ExamDetail screen
import ExamDetail from "../app/teacher/ExamDetail";
// Import ExamGrading screen
import ExamGrading from "../app/teacher/ExamGrading";
// Import Student Exams screens
import StudentExamsList from "../app/student/StudentExamsList";
import StudentExamDetail from "../app/student/StudentExamDetail";
// Import Student Grades screen
import StudentGrades from "../app/student/StudentGrades";

const Stack = createNativeStackNavigator();

/**
 * Ana çekmece navigasyonu
 * Not: SlideMenu component'i ayrı bir dosyaya taşındı
 * ve döngüsel bağımlılık ortadan kaldırıldı
 */
export default function AppDrawer() {
  const { role } = useContext(SessionContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === "admin" && (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="TeachersList" component={TeachersList} />
          <Stack.Screen name="StudentsList" component={StudentsList} />
        </>
      )}
      {role === "teacher" && (
        <>
          <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
          <Stack.Screen name="TeacherSchedule" component={TeacherSchedule} />
          <Stack.Screen name="TeacherScheduleScreen" component={TeacherScheduleScreen} />
          <Stack.Screen name="Attendance" component={Attendance} />
          <Stack.Screen name="AttendanceResults" component={AttendanceResults} />
          <Stack.Screen
            name="TeachersList"
            component={TeachersList}
          />
          <Stack.Screen name="StudentsList" component={StudentsList} />

          <Stack.Screen
            name="HomeworkAssignment"
            component={HomeworkAssignment}
          />
          <Stack.Screen
            name="HomeworksGivenList"
            component={HomeworksGivenList}
          />
          <Stack.Screen
            name="HomeworkGivenDetail"
            component={HomeworkGivenDetail}
          />
          <Stack.Screen name="ExamAdd" component={ExamAdd} />
          <Stack.Screen name="ExamsList" component={ExamsList} />
          <Stack.Screen name="ExamDetail" component={ExamDetail} />
          <Stack.Screen name="ExamGrading" component={ExamGrading} />
        </>
      )}
      {role === "parent" && (
        <>
          <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
          <Stack.Screen
            name="StudentHomeworkList"
            component={StudentHomeworkList}
          />
          <Stack.Screen
            name="StudentHomeworkDetail"
            component={StudentHomeworkDetail}
          />
          <Stack.Screen name="StudentExamsList" component={StudentExamsList} />
          <Stack.Screen name="StudentExamDetail" component={StudentExamDetail} />
          <Stack.Screen name="StudentGrades" component={StudentGrades} />
          <Stack.Screen name="StudentAbsences" component={StudentAbsences} />
          <Stack.Screen name="StudentSchedule" component={StudentScheduleScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

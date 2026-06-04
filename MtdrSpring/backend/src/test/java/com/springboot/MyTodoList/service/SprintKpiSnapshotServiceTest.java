package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.dto.DeveloperStatDto;
import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintKpiSnapshot;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskStateHistory;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.model.TaskWorkLog;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.SprintKpiSnapshotRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.repository.TaskStateHistoryRepository;
import com.springboot.MyTodoList.repository.TaskWorkLogRepository;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SprintKpiSnapshotServiceTest {

    @Mock
    private SprintKpiSnapshotRepository snapshotRepository;

    @Mock
    private SprintRepository sprintRepository;

    @Mock
    private ToDoItemRepository taskRepository;

    @Mock
    private TaskWorkLogRepository workLogRepository;

    @Mock
    private TaskStateHistoryRepository stateHistoryRepository;

    @InjectMocks
    private SprintKpiSnapshotService service;

    @Test
    void computeBuildsSnapshotFromSprintTasksHistoryAndWorkLogs() {
        Sprint sprint = sprint("Sprint 4", LocalDate.of(2026, 5, 16), 4);
        User ana = user("ana@example.com");
        Task done = task(sprint, ana, TaskStatus.DONE);
        done.setEnteredInProgressAt(LocalDateTime.of(2026, 5, 17, 9, 0));
        done.setCompletedAt(LocalDateTime.of(2026, 5, 19, 9, 0));
        done.setSprintAddedAt(LocalDateTime.of(2026, 5, 18, 10, 0));
        done.setReworkCount(1);

        Task blocked = task(sprint, ana, TaskStatus.BLOCKED);
        blocked.setSprintAddedAt(LocalDateTime.of(2026, 5, 16, 9, 0));

        TaskWorkLog log = workLog(done, ana, BigDecimal.valueOf(6.5));

        TaskStateHistory blockedEntry = history(TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED,
            LocalDateTime.of(2026, 5, 20, 8, 0));
        TaskStateHistory blockedExit = history(TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS,
            LocalDateTime.of(2026, 5, 21, 20, 0));

        when(taskRepository.findBySprint_Id(sprint.getId())).thenReturn(List.of(done, blocked));
        when(stateHistoryRepository.findByTask_IdOrderByChangedAtAsc(done.getId())).thenReturn(List.of());
        when(stateHistoryRepository.findByTask_IdOrderByChangedAtAsc(blocked.getId()))
            .thenReturn(List.of(blockedEntry, blockedExit));
        when(workLogRepository.findBySprintId(sprint.getId())).thenReturn(List.of(log));
        when(snapshotRepository.findBySprint_Id(sprint.getId())).thenReturn(Optional.empty());
        when(snapshotRepository.save(org.mockito.ArgumentMatchers.any(SprintKpiSnapshot.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        SprintKpiSnapshot snapshot = service.compute(sprint);

        assertSame(sprint, snapshot.getSprint());
        assertEquals(new BigDecimal("2.00"), snapshot.getAvgCycleTimeDays());
        assertEquals(new BigDecimal("25.00"), snapshot.getScopeCreepRatePct());
        assertEquals(new BigDecimal("1.50"), snapshot.getBlockerResolutionDays());
        assertEquals(1, snapshot.getTasksReworked());
        assertEquals(1, snapshot.getTasksCompleted());
        assertEquals(new BigDecimal("6.5"), snapshot.getTotalHoursWorked());
    }

    @Test
    void computeReusesExistingSnapshotAndLeavesMissingMetricsNull() {
        Sprint sprint = sprint("Sprint 5", LocalDate.of(2026, 6, 1), 0);
        Task todo = task(sprint, user("luis@example.com"), TaskStatus.TODO);
        SprintKpiSnapshot existing = new SprintKpiSnapshot();

        when(taskRepository.findBySprint_Id(sprint.getId())).thenReturn(List.of(todo));
        when(stateHistoryRepository.findByTask_IdOrderByChangedAtAsc(todo.getId())).thenReturn(List.of());
        when(workLogRepository.findBySprintId(sprint.getId())).thenReturn(List.of());
        when(snapshotRepository.findBySprint_Id(sprint.getId())).thenReturn(Optional.of(existing));
        when(snapshotRepository.save(existing)).thenReturn(existing);

        SprintKpiSnapshot snapshot = service.compute(sprint);

        assertSame(existing, snapshot);
        assertNull(snapshot.getAvgCycleTimeDays());
        assertNull(snapshot.getScopeCreepRatePct());
        assertNull(snapshot.getBlockerResolutionDays());
        assertNull(snapshot.getTotalHoursWorked());
        assertEquals(0, snapshot.getTasksCompleted());
        assertEquals(0, snapshot.getTasksReworked());
    }

    @Test
    void getDeveloperStatsGroupsTasksAndHoursByAssignee() {
        Sprint sprint = sprint("Sprint 4", LocalDate.of(2026, 5, 16), 0);
        User ana = user("ana@example.com");
        User baltazar = user("baltazar@example.com");
        Task anaDone = task(sprint, ana, TaskStatus.DONE);
        Task anaTodo = task(sprint, ana, TaskStatus.TODO);
        Task baltazarDone = task(sprint, baltazar, TaskStatus.DONE);
        Task unassigned = task(sprint, null, TaskStatus.DONE);

        when(taskRepository.findBySprint_Id(sprint.getId()))
            .thenReturn(List.of(anaDone, anaTodo, baltazarDone, unassigned));
        when(workLogRepository.findBySprintId(sprint.getId()))
            .thenReturn(List.of(
                workLog(anaDone, ana, BigDecimal.valueOf(2.5)),
                workLog(anaTodo, ana, BigDecimal.valueOf(1.5))
            ));

        List<DeveloperStatDto> stats = service.getDeveloperStats(sprint.getId());

        assertEquals(2, stats.size());
        assertEquals("ana@example.com", stats.get(0).getEmail());
        assertEquals(2, stats.get(0).getTotalAssigned());
        assertEquals(1, stats.get(0).getTasksCompleted());
        assertEquals(new BigDecimal("4.0"), stats.get(0).getTotalHoursWorked());
        assertEquals("baltazar@example.com", stats.get(1).getEmail());
        assertEquals(1, stats.get(1).getTotalAssigned());
        assertEquals(1, stats.get(1).getTasksCompleted());
        assertEquals(BigDecimal.ZERO, stats.get(1).getTotalHoursWorked());
    }

    @Test
    void findPreviousSprintSnapshotUsesLatestEarlierSprintInSameProject() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        Sprint sprint0 = sprint("Sprint 0", LocalDate.of(2026, 2, 22), 0);
        Sprint sprint3 = sprint("Sprint 3", LocalDate.of(2026, 4, 26), 0);
        Sprint sprint4 = sprint("Sprint 4", LocalDate.of(2026, 5, 16), 0);
        Sprint future = sprint("Sprint 5", LocalDate.of(2026, 6, 1), 0);
        sprint0.setProject(project);
        sprint3.setProject(project);
        sprint4.setProject(project);
        future.setProject(project);
        SprintKpiSnapshot previousSnapshot = new SprintKpiSnapshot();

        when(sprintRepository.findByProject_Id(project.getId()))
            .thenReturn(List.of(sprint0, sprint3, sprint4, future));
        when(snapshotRepository.findBySprint_Id(sprint3.getId())).thenReturn(Optional.of(previousSnapshot));

        Optional<SprintKpiSnapshot> result = service.findPreviousSprintSnapshot(sprint4);

        assertEquals(Optional.of(previousSnapshot), result);
        verify(snapshotRepository).findBySprint_Id(sprint3.getId());
    }

    @Test
    void findBySprintIdDelegatesToRepository() {
        UUID sprintId = UUID.randomUUID();
        SprintKpiSnapshot snapshot = new SprintKpiSnapshot();
        when(snapshotRepository.findBySprint_Id(sprintId)).thenReturn(Optional.of(snapshot));

        assertEquals(Optional.of(snapshot), service.findBySprintId(sprintId));
    }

    private Sprint sprint(String name, LocalDate startDate, int plannedTaskCount) {
        Project project = new Project();
        project.setId(UUID.randomUUID());

        Sprint sprint = new Sprint();
        sprint.setId(UUID.randomUUID());
        sprint.setName(name);
        sprint.setProject(project);
        sprint.setStartDate(startDate);
        sprint.setEndDate(startDate.plusDays(14));
        sprint.setPlannedTaskCount(plannedTaskCount);
        return sprint;
    }

    private User user(String email) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        return user;
    }

    private Task task(Sprint sprint, User assignee, TaskStatus status) {
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setSprint(sprint);
        task.setProject(sprint.getProject());
        task.setAssignee(assignee);
        task.setStatus(status);
        return task;
    }

    private TaskWorkLog workLog(Task task, User user, BigDecimal hours) {
        TaskWorkLog log = new TaskWorkLog();
        log.setTask(task);
        log.setUser(user);
        log.setHoursWorked(hours);
        return log;
    }

    private TaskStateHistory history(TaskStatus fromStatus, TaskStatus toStatus, LocalDateTime changedAt) {
        TaskStateHistory history = new TaskStateHistory();
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setChangedAt(changedAt);
        return history;
    }
}

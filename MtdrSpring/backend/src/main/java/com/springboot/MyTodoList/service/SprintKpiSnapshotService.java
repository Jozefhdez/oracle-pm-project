package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.dto.AgingWipItemDto;
import com.springboot.MyTodoList.dto.BlockedTaskItemDto;
import com.springboot.MyTodoList.dto.BotAdoptionDto;
import com.springboot.MyTodoList.dto.CycleTimeTrendPointDto;
import com.springboot.MyTodoList.dto.DeveloperStatDto;
import com.springboot.MyTodoList.dto.TimeToActionDto;
import com.springboot.MyTodoList.model.ChangeSource;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintKpiSnapshot;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskAssignmentHistory;
import com.springboot.MyTodoList.model.TaskStateHistory;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.model.TaskWorkLog;
import com.springboot.MyTodoList.repository.SprintKpiSnapshotRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.repository.TaskAssignmentHistoryRepository;
import com.springboot.MyTodoList.repository.TaskStateHistoryRepository;
import com.springboot.MyTodoList.repository.TaskWorkLogRepository;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SprintKpiSnapshotService {

    @Autowired
    private SprintKpiSnapshotRepository snapshotRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private ToDoItemRepository taskRepository;

    @Autowired
    private TaskWorkLogRepository workLogRepository;

    @Autowired
    private TaskStateHistoryRepository stateHistoryRepository;

    @Autowired
    private TaskAssignmentHistoryRepository assignmentHistoryRepository;

    public Optional<SprintKpiSnapshot> findBySprintId(UUID sprintId) {
        return snapshotRepository.findBySprint_Id(sprintId);
    }

    public Optional<SprintKpiSnapshot> findPreviousSprintSnapshot(Sprint sprint) {
        return sprintRepository.findByProject_Id(sprint.getProject().getId()).stream()
            .filter(s -> s.getStartDate().isBefore(sprint.getStartDate()))
            .max(Comparator.comparing(Sprint::getStartDate))
            .flatMap(prev -> snapshotRepository.findBySprint_Id(prev.getId()));
    }

    public List<DeveloperStatDto> getDeveloperStats(UUID sprintId) {
        List<Task> tasks = taskRepository.findBySprint_Id(sprintId);
        List<TaskWorkLog> workLogs = workLogRepository.findBySprintId(sprintId);

        Map<UUID, BigDecimal> hoursByUser = workLogs.stream()
            .collect(Collectors.groupingBy(
                wl -> wl.getUser().getId(),
                Collectors.reducing(BigDecimal.ZERO, TaskWorkLog::getHoursWorked, BigDecimal::add)
            ));

        Map<UUID, List<Task>> tasksByAssignee = tasks.stream()
            .filter(t -> t.getAssignee() != null)
            .collect(Collectors.groupingBy(t -> t.getAssignee().getId()));

        return tasksByAssignee.entrySet().stream()
            .map(entry -> {
                UUID userId = entry.getKey();
                List<Task> devTasks = entry.getValue();
                String email = devTasks.get(0).getAssignee().getEmail();
                int total = devTasks.size();
                int completed = (int) devTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
                BigDecimal hours = hoursByUser.getOrDefault(userId, BigDecimal.ZERO);
                return new DeveloperStatDto(email, total, completed, hours);
            })
            .sorted(Comparator.comparing(DeveloperStatDto::getEmail))
            .collect(Collectors.toList());
    }

    public SprintKpiSnapshot compute(Sprint sprint) {
        List<Task> tasks = taskRepository.findBySprint_Id(sprint.getId());

        List<Task> completed = tasks.stream()
            .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCompletedAt() != null)
            .collect(Collectors.toList());

        BigDecimal avgCycleTime = null;
        List<Long> cycleMins = completed.stream()
            .filter(t -> t.getEnteredInProgressAt() != null)
            .map(t -> Duration.between(t.getEnteredInProgressAt(), t.getCompletedAt()).toMinutes())
            .collect(Collectors.toList());
        if (!cycleMins.isEmpty()) {
            double avg = cycleMins.stream().mapToLong(Long::longValue).average().getAsDouble();
            avgCycleTime = BigDecimal.valueOf(avg / 1440.0).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal scopeCreep = null;
        int planned = sprint.getPlannedTaskCount();
        if (planned > 0) {
            long addedLate = tasks.stream()
                .filter(t -> t.getSprintAddedAt() != null
                    && t.getSprintAddedAt().toLocalDate().isAfter(sprint.getStartDate()))
                .count();
            scopeCreep = BigDecimal.valueOf((double) addedLate / planned * 100)
                .setScale(2, RoundingMode.HALF_UP);
        }

        // Pair each BLOCKED entry with the next exit from BLOCKED to get each blocked duration.
        BigDecimal avgBlockerResolution = null;
        List<Long> blockerMins = new ArrayList<>();
        for (Task task : tasks) {
            List<TaskStateHistory> history =
                stateHistoryRepository.findByTask_IdOrderByChangedAtAsc(task.getId());

            TaskStateHistory blockedEntry = null;
            for (TaskStateHistory h : history) {
                if (h.getToStatus() == TaskStatus.BLOCKED) {
                    blockedEntry = h;
                } else if (blockedEntry != null && h.getFromStatus() == TaskStatus.BLOCKED
                        && h.getChangedAt() != null && blockedEntry.getChangedAt() != null) {
                    blockerMins.add(Duration.between(blockedEntry.getChangedAt(), h.getChangedAt()).toMinutes());
                    blockedEntry = null;
                }
            }
        }
        if (!blockerMins.isEmpty()) {
            double avg = blockerMins.stream().mapToLong(Long::longValue).average().getAsDouble();
            avgBlockerResolution = BigDecimal.valueOf(avg / 1440.0).setScale(2, RoundingMode.HALF_UP);
        }

        // KPI-P3: count only DONE tasks that were reworked (matches SQL WHERE status='DONE')
        int reworked = (int) completed.stream().filter(t -> t.getReworkCount() > 0).count();

        BigDecimal totalHours = workLogRepository.findBySprintId(sprint.getId()).stream()
            .map(TaskWorkLog::getHoursWorked)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        SprintKpiSnapshot snapshot = snapshotRepository.findBySprint_Id(sprint.getId())
            .orElse(new SprintKpiSnapshot());
        snapshot.setSprint(sprint);
        snapshot.setAvgCycleTimeDays(avgCycleTime);
        snapshot.setScopeCreepRatePct(scopeCreep);
        snapshot.setBlockerResolutionDays(avgBlockerResolution);
        snapshot.setTasksReworked(reworked);
        snapshot.setTasksCompleted(completed.size());
        snapshot.setTotalHoursWorked(totalHours.compareTo(BigDecimal.ZERO) == 0 ? null : totalHours);

        return snapshotRepository.save(snapshot);
    }

    public List<AgingWipItemDto> getAgingWip(UUID sprintId) {
        LocalDateTime now = LocalDateTime.now();
        return taskRepository.findBySprint_Id(sprintId).stream()
            .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS
                && t.getEnteredInProgressAt() != null
                && t.getAssignee() != null)
            .map(t -> {
                double days = Math.round(
                    Duration.between(t.getEnteredInProgressAt(), now).toMinutes() / 1440.0 * 10) / 10.0;
                String health = days > 3 ? "STALE" : "OK";
                return new AgingWipItemDto(t.getId(), t.getTitle(), t.getAssignee().getEmail(), days, health);
            })
            .sorted(Comparator.comparingDouble(AgingWipItemDto::getDaysInProgress).reversed())
            .collect(Collectors.toList());
    }

    public List<BlockedTaskItemDto> getBlockedTasks(UUID sprintId) {
        LocalDateTime now = LocalDateTime.now();
        return taskRepository.findBySprint_Id(sprintId).stream()
            .filter(t -> t.getStatus() == TaskStatus.BLOCKED
                && t.getBlockedAt() != null
                && t.getAssignee() != null)
            .map(t -> {
                double days = Math.round(
                    Duration.between(t.getBlockedAt(), now).toMinutes() / 1440.0 * 10) / 10.0;
                return new BlockedTaskItemDto(
                    t.getId(), t.getTitle(), t.getPriority().name(),
                    t.getAssignee().getEmail(), days, t.getReworkCount());
            })
            .sorted(Comparator.comparingDouble(BlockedTaskItemDto::getDaysBlocked).reversed())
            .collect(Collectors.toList());
    }

    public List<TimeToActionDto> getTimeToAction(UUID sprintId) {
        List<Task> tasks = taskRepository.findBySprint_Id(sprintId).stream()
            .filter(t -> t.getEnteredInProgressAt() != null)
            .collect(Collectors.toList());

        Map<String, List<Long>> minutesByEmail = new HashMap<>();
        for (Task task : tasks) {
            // Allow 1 s grace: trg_task_bu sets entered_in_progress_at then assigned_at in the
            // same trigger body, so assigned_at can be a few microseconds later than
            // entered_in_progress_at when both change in a single UPDATE statement.
            LocalDateTime graceCutoff = task.getEnteredInProgressAt().plusSeconds(1);
            assignmentHistoryRepository.findByTask_IdOrderByAssignedAtAsc(task.getId()).stream()
                .filter(a -> a.getAssignedAt() != null
                    && !a.getAssignedAt().isAfter(graceCutoff)
                    && (a.getUnassignedAt() == null || !a.getUnassignedAt().isBefore(task.getEnteredInProgressAt())))
                .max(Comparator.comparing(TaskAssignmentHistory::getAssignedAt))
                .ifPresent(a -> {
                    String email = a.getAssignee().getEmail();
                    long mins = Duration.between(a.getAssignedAt(), task.getEnteredInProgressAt()).toMinutes();
                    minutesByEmail.computeIfAbsent(email, k -> new ArrayList<>()).add(mins);
                });
        }

        return minutesByEmail.entrySet().stream()
            .map(e -> {
                double avgDays = e.getValue().stream().mapToLong(Long::longValue).average().orElse(0) / 1440.0;
                BigDecimal rounded = BigDecimal.valueOf(avgDays).setScale(2, RoundingMode.HALF_UP);
                return new TimeToActionDto(e.getKey(), e.getValue().size(), rounded);
            })
            .sorted(Comparator.comparing(TimeToActionDto::getAvgTimeToActionDays))
            .collect(Collectors.toList());
    }

    public List<BotAdoptionDto> getBotAdoption(UUID sprintId) {
        List<TaskStateHistory> histories = stateHistoryRepository.findByTask_Sprint_Id(sprintId);

        Map<String, int[]> countsByEmail = new HashMap<>();
        for (TaskStateHistory h : histories) {
            if (h.getSource() == ChangeSource.SYSTEM) continue;
            String email = h.getChangedBy().getEmail();
            countsByEmail.computeIfAbsent(email, k -> new int[]{0, 0});
            if (h.getSource() == ChangeSource.WEB) {
                countsByEmail.get(email)[0]++;
            } else if (h.getSource() == ChangeSource.TELEGRAM) {
                countsByEmail.get(email)[1]++;
            }
        }

        return countsByEmail.entrySet().stream()
            .map(e -> {
                int web = e.getValue()[0];
                int bot = e.getValue()[1];
                int total = web + bot;
                BigDecimal botPct = total > 0
                    ? BigDecimal.valueOf((double) bot / total * 100).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
                return new BotAdoptionDto(e.getKey(), web, bot, total, botPct);
            })
            .sorted(Comparator.comparing(BotAdoptionDto::getBotAdoptionPct).reversed())
            .collect(Collectors.toList());
    }

    public List<CycleTimeTrendPointDto> getCycleTimeTrend(UUID projectId) {
        return sprintRepository.findByProject_Id(projectId).stream()
            .sorted(Comparator.comparing(Sprint::getStartDate))
            .map(sprint -> {
                SprintKpiSnapshot snap = snapshotRepository.findBySprint_Id(sprint.getId())
                    .orElseGet(() -> compute(sprint));
                long sprintDays = ChronoUnit.DAYS.between(sprint.getStartDate(), sprint.getEndDate());
                BigDecimal tasksPerDay = sprintDays > 0
                    ? BigDecimal.valueOf((double) snap.getTasksCompleted() / sprintDays)
                        .setScale(2, RoundingMode.HALF_UP)
                    : null;
                return new CycleTimeTrendPointDto(
                    sprint.getName(),
                    sprint.getStartDate(),
                    snap.getAvgCycleTimeDays(),
                    snap.getTasksCompleted(),
                    tasksPerDay);
            })
            .collect(Collectors.toList());
    }
}

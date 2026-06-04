package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.dto.AgingWipItemDto;
import com.springboot.MyTodoList.dto.BlockedTaskItemDto;
import com.springboot.MyTodoList.dto.BotAdoptionDto;
import com.springboot.MyTodoList.dto.DeveloperStatDto;
import com.springboot.MyTodoList.dto.SprintKpiResponse;
import com.springboot.MyTodoList.dto.TimeToActionDto;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintKpiSnapshot;
import com.springboot.MyTodoList.model.SprintStatus;
import com.springboot.MyTodoList.service.SprintKpiSnapshotService;
import com.springboot.MyTodoList.service.SprintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sprints/{sprintId}/kpi")
public class SprintKpiSnapshotController {

    @Autowired
    private SprintKpiSnapshotService sprintKpiSnapshotService;

    @Autowired
    private SprintService sprintService;

    @GetMapping
    public ResponseEntity<SprintKpiResponse> getKpi(@PathVariable UUID sprintId) {
        Sprint sprint = sprintService.findById(sprintId).orElse(null);
        if (sprint == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        SprintKpiSnapshot snapshot = sprint.getStatus() == SprintStatus.COMPLETED
            ? sprintKpiSnapshotService.findBySprintId(sprintId)
                .orElseGet(() -> sprintKpiSnapshotService.compute(sprint))
            : sprintKpiSnapshotService.compute(sprint);

        SprintKpiResponse response = SprintKpiResponse.from(snapshot);

        sprintKpiSnapshotService.findPreviousSprintSnapshot(sprint).ifPresent(prev -> {
            BigDecimal current = snapshot.getAvgCycleTimeDays();
            BigDecimal previous = prev.getAvgCycleTimeDays();
            if (current != null && previous != null && previous.compareTo(BigDecimal.ZERO) != 0) {
                BigDecimal changePct = current.subtract(previous)
                    .divide(previous, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
                response.setCycleTimeChangePct(changePct);
            }
        });

        return ResponseEntity.ok(response);
    }

    @PostMapping("/compute")
    public ResponseEntity<SprintKpiSnapshot> computeKpi(@PathVariable UUID sprintId) {
        Sprint sprint = sprintService.findById(sprintId).orElse(null);
        if (sprint == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        SprintKpiSnapshot snapshot = sprintKpiSnapshotService.compute(sprint);
        return new ResponseEntity<>(snapshot, HttpStatus.OK);
    }

    @GetMapping("/developer-stats")
    public ResponseEntity<List<DeveloperStatDto>> getDeveloperStats(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintKpiSnapshotService.getDeveloperStats(sprintId));
    }

    @GetMapping("/aging-wip")
    public ResponseEntity<List<AgingWipItemDto>> getAgingWip(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintKpiSnapshotService.getAgingWip(sprintId));
    }

    @GetMapping("/blocked-tasks")
    public ResponseEntity<List<BlockedTaskItemDto>> getBlockedTasks(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintKpiSnapshotService.getBlockedTasks(sprintId));
    }

    @GetMapping("/time-to-action")
    public ResponseEntity<List<TimeToActionDto>> getTimeToAction(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintKpiSnapshotService.getTimeToAction(sprintId));
    }

    @GetMapping("/bot-adoption")
    public ResponseEntity<List<BotAdoptionDto>> getBotAdoption(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintKpiSnapshotService.getBotAdoption(sprintId));
    }
}

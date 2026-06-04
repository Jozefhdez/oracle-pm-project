package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.dto.CycleTimeTrendPointDto;
import com.springboot.MyTodoList.service.SprintKpiSnapshotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/kpi")
public class ProjectKpiController {

    @Autowired
    private SprintKpiSnapshotService sprintKpiSnapshotService;

    @GetMapping("/cycle-time-trend")
    public ResponseEntity<List<CycleTimeTrendPointDto>> getCycleTimeTrend(@PathVariable UUID projectId) {
        return ResponseEntity.ok(sprintKpiSnapshotService.getCycleTimeTrend(projectId));
    }
}

package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/kpi/ai-insight")
public class KpiAiInsightController {

    private final GeminiService geminiService;

    public KpiAiInsightController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> generateInsight(@RequestBody Map<String, Object> body) {
        String question = Objects.toString(body.get("question"), "");
        if (!isRelevantKpiQuestion(question)) {
            return ResponseEntity.ok(Map.of(
                "insight",
                "I can only answer questions about this KPI dashboard, sprint performance, workload, tasks, or developer metrics.",
                "source",
                "scope_guard"
            ));
        }

        try {
            String prompt = """
                You are an AI project management analyst for an Oracle Cloud student team.
                Use only the KPI context below. Do not invent metrics.
                If the user asks for anything unrelated to the KPI dashboard, sprint performance,
                workload, tasks, or developer metrics, politely say that you can only answer KPI
                dashboard questions.
                Write a concise, practical answer in 2-4 bullets.
                Mention the most important risk or opportunity first.
                If the user asks a question, answer it directly.
                Avoid generic advice and avoid markdown tables.

                KPI context:
                %s
                """.formatted(body);

            String insight = geminiService.generateText(prompt);
            String trimmedInsight = insight == null ? "" : insight.trim();
            if (!trimmedInsight.isEmpty()) {
                return ResponseEntity.ok(Map.of("insight", trimmedInsight, "source", "gemini"));
            }
        } catch (Exception e) {
            // Keep the demo flow useful even when Gemini is not configured locally.
        }

        return ResponseEntity.ok(Map.of("insight", buildFallbackInsight(body), "source", "fallback"));
    }

    private boolean isRelevantKpiQuestion(String question) {
        if (question == null || question.isBlank()) return true;

        String normalized = question.toLowerCase();
        String[] allowedTerms = {
            "kpi", "dashboard", "sprint", "project", "team", "developer", "workload",
            "task", "tasks", "hours", "risk", "risks", "performance", "completion",
            "assigned", "blocked", "balance", "focus", "metric", "metrics", "velocity",
            "kanban", "devops", "planning", "summary",
            "tarea", "tareas", "equipo", "desarrollador", "desarrolladores", "carga",
            "riesgo", "riesgos", "rendimiento", "horas", "bloqueado", "balanceado",
            "enfocar", "resumen", "proyecto", "metrica", "metricas"
        };

        for (String term : allowedTerms) {
            if (normalized.contains(term)) return true;
        }

        return false;
    }

    private String buildFallbackInsight(Map<String, Object> body) {
        List<DeveloperSummary> summaries = collectDeveloperSummaries(body.get("visibleDeveloperStats"));
        if (summaries.isEmpty()) {
            return """
                - No KPI data is available for the current filters yet.
                - Select a sprint with developer stats to generate a more useful insight.
                """.trim();
        }

        int totalAssigned = summaries.stream().mapToInt(DeveloperSummary::totalAssigned).sum();
        int totalCompleted = summaries.stream().mapToInt(DeveloperSummary::tasksCompleted).sum();
        double totalHours = summaries.stream().mapToDouble(DeveloperSummary::totalHoursWorked).sum();

        DeveloperSummary busiest = summaries.stream()
            .max(Comparator.comparingInt(DeveloperSummary::totalAssigned))
            .orElse(summaries.get(0));
        DeveloperSummary mostHours = summaries.stream()
            .max(Comparator.comparingDouble(DeveloperSummary::totalHoursWorked))
            .orElse(summaries.get(0));

        double completionRate = totalAssigned == 0 ? 0 : (totalCompleted * 100.0 / totalAssigned);
        String scope = Objects.toString(body.get("sprintScope"), "current sprint");

        return """
            - %s is at %.1f%% completion: %d of %d assigned tasks are done.
            - Main workload risk: %s has the most assigned tasks (%d).
            - Time tracking shows %.1f real hours logged; %s has the highest logged effort (%.1f h).
            - Next step: verify blockers and redistribute work if one developer owns the remaining critical tasks.
            """.formatted(
                scope,
                completionRate,
                totalCompleted,
                totalAssigned,
                shortEmail(busiest.email()),
                busiest.totalAssigned(),
                totalHours,
                shortEmail(mostHours.email()),
                mostHours.totalHoursWorked()
            ).trim();
    }

    private List<DeveloperSummary> collectDeveloperSummaries(Object rawStats) {
        List<Map<String, Object>> statMaps = new ArrayList<>();
        collectStatMaps(rawStats, statMaps);

        Map<String, DeveloperSummary> totalsByEmail = new LinkedHashMap<>();
        for (Map<String, Object> stat : statMaps) {
            String email = Objects.toString(stat.get("email"), "Unknown developer");
            DeveloperSummary existing = totalsByEmail.getOrDefault(
                email,
                new DeveloperSummary(email, 0, 0, 0.0)
            );
            totalsByEmail.put(
                email,
                new DeveloperSummary(
                    email,
                    existing.totalAssigned() + numberAsInt(stat.get("totalAssigned")),
                    existing.tasksCompleted() + numberAsInt(stat.get("tasksCompleted")),
                    existing.totalHoursWorked() + numberAsDouble(stat.get("totalHoursWorked"))
                )
            );
        }

        return new ArrayList<>(totalsByEmail.values());
    }

    @SuppressWarnings("unchecked")
    private void collectStatMaps(Object node, List<Map<String, Object>> statMaps) {
        if (node instanceof Map<?, ?> rawMap) {
            Map<String, Object> map = (Map<String, Object>) rawMap;
            if (map.containsKey("email") && map.containsKey("totalAssigned")) {
                statMaps.add(map);
            }
            map.values().forEach((value) -> collectStatMaps(value, statMaps));
            return;
        }

        if (node instanceof Collection<?> collection) {
            collection.forEach((value) -> collectStatMaps(value, statMaps));
        }
    }

    private int numberAsInt(Object value) {
        if (value instanceof Number number) return number.intValue();
        if (value instanceof String text && !text.isBlank()) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }
        return 0;
    }

    private double numberAsDouble(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        if (value instanceof String text && !text.isBlank()) {
            try {
                return Double.parseDouble(text);
            } catch (NumberFormatException ignored) {
                return 0.0;
            }
        }
        return 0.0;
    }

    private String shortEmail(String email) {
        if (email == null || email.isBlank()) return "Unknown developer";
        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private record DeveloperSummary(
        String email,
        int totalAssigned,
        int tasksCompleted,
        double totalHoursWorked
    ) {}
}

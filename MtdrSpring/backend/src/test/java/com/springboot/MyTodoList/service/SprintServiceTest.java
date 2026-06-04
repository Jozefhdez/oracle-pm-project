package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintStatus;
import com.springboot.MyTodoList.repository.SprintRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SprintServiceTest {

    @Mock
    private SprintRepository sprintRepository;

    @InjectMocks
    private SprintService service;

    @Test
    void updateCopiesEditableFieldsAndSavesExistingSprint() {
        UUID id = UUID.randomUUID();
        Sprint existing = sprint("Old", SprintStatus.UPCOMING, LocalDate.of(2026, 5, 1));
        Sprint updates = sprint("Sprint 4", SprintStatus.ACTIVE, LocalDate.of(2026, 5, 16));

        when(sprintRepository.findById(id)).thenReturn(Optional.of(existing));
        when(sprintRepository.save(existing)).thenReturn(existing);

        Sprint result = service.update(id, updates);

        assertSame(existing, result);
        assertEquals("Sprint 4", existing.getName());
        assertEquals(SprintStatus.ACTIVE, existing.getStatus());
        assertEquals(LocalDate.of(2026, 5, 16), existing.getStartDate());
        assertEquals(LocalDate.of(2026, 5, 30), existing.getEndDate());
    }

    @Test
    void updateReturnsNullWhenSprintDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(sprintRepository.findById(id)).thenReturn(Optional.empty());

        assertNull(service.update(id, sprint("Missing", SprintStatus.UPCOMING, LocalDate.now())));
    }

    @Test
    void deleteReturnsTrueWhenRepositoryDoesNotThrow() {
        UUID successId = UUID.randomUUID();

        assertTrue(service.delete(successId));
    }

    @Test
    void deleteReturnsFalseWhenRepositoryThrows() {
        UUID failureId = UUID.randomUUID();
        doThrow(new RuntimeException("database error")).when(sprintRepository).deleteById(failureId);

        assertFalse(service.delete(failureId));
    }

    @Test
    void findAndSaveMethodsDelegateToRepository() {
        UUID sprintId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        Sprint sprint = sprint("Sprint 4", SprintStatus.ACTIVE, LocalDate.of(2026, 5, 16));

        when(sprintRepository.findByProject_Id(projectId)).thenReturn(List.of(sprint));
        when(sprintRepository.findByProject_IdAndStatus(projectId, SprintStatus.ACTIVE))
            .thenReturn(List.of(sprint));
        when(sprintRepository.findById(sprintId)).thenReturn(Optional.of(sprint));
        when(sprintRepository.save(sprint)).thenReturn(sprint);

        assertEquals(List.of(sprint), service.findByProjectId(projectId));
        assertEquals(List.of(sprint), service.findByProjectIdAndStatus(projectId, SprintStatus.ACTIVE));
        assertEquals(Optional.of(sprint), service.findById(sprintId));
        assertSame(sprint, service.save(sprint));
    }

    private Sprint sprint(String name, SprintStatus status, LocalDate startDate) {
        Sprint sprint = new Sprint();
        sprint.setName(name);
        sprint.setStatus(status);
        sprint.setStartDate(startDate);
        sprint.setEndDate(startDate.plusDays(14));
        return sprint;
    }
}

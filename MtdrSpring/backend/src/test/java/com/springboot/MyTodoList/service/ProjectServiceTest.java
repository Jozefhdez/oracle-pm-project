package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.model.ProjectMember;
import com.springboot.MyTodoList.model.ProjectRole;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.ProjectMemberRepository;
import com.springboot.MyTodoList.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @InjectMocks
    private ProjectService service;

    @Test
    void createWithOwnerSavesProjectAndManagerMembership() {
        User owner = user("jozef@example.com");
        Project project = project("Oracle PM");
        Project saved = project("Oracle PM");
        saved.setId(UUID.randomUUID());

        when(projectRepository.save(project)).thenReturn(saved);

        Project result = service.createWithOwner(project, owner);

        assertSame(saved, result);
        assertSame(owner, project.getOwner());

        ArgumentCaptor<ProjectMember> memberCaptor = ArgumentCaptor.forClass(ProjectMember.class);
        verify(projectMemberRepository).save(memberCaptor.capture());
        ProjectMember membership = memberCaptor.getValue();
        assertSame(saved, membership.getProject());
        assertSame(owner, membership.getUser());
        assertEquals(ProjectRole.PROJECT_MANAGER, membership.getRole());
    }

    @Test
    void updateReturnsSavedProjectWhenProjectExists() {
        UUID id = UUID.randomUUID();
        Project existing = project("Old name");
        Project updates = project("New name");
        updates.setDescription("Updated description");

        when(projectRepository.findById(id)).thenReturn(Optional.of(existing));
        when(projectRepository.save(existing)).thenReturn(existing);

        Project result = service.update(id, updates);

        assertSame(existing, result);
        assertEquals("New name", existing.getName());
        assertEquals("Updated description", existing.getDescription());
    }

    @Test
    void updateReturnsNullWhenProjectDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(projectRepository.findById(id)).thenReturn(Optional.empty());

        assertNull(service.update(id, project("Missing")));
    }

    @Test
    void deleteReturnsTrueWhenRepositoryDoesNotThrow() {
        UUID successId = UUID.randomUUID();

        assertTrue(service.delete(successId));
    }

    @Test
    void deleteReturnsFalseWhenRepositoryThrows() {
        UUID failureId = UUID.randomUUID();
        doThrow(new RuntimeException("database error")).when(projectRepository).deleteById(failureId);

        assertFalse(service.delete(failureId));
    }

    @Test
    void findMethodsDelegateToRepository() {
        UUID userId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        Project project = project("Oracle PM");

        when(projectRepository.findAll()).thenReturn(List.of(project));
        when(projectRepository.findByOwner_Id(userId)).thenReturn(List.of(project));
        when(projectRepository.findByMembers_User_Id(userId)).thenReturn(List.of(project));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.save(project)).thenReturn(project);

        assertEquals(List.of(project), service.findAll());
        assertEquals(List.of(project), service.findByOwnerId(userId));
        assertEquals(List.of(project), service.findByMemberId(userId));
        assertEquals(Optional.of(project), service.findById(projectId));
        assertSame(project, service.save(project));
    }

    private Project project(String name) {
        Project project = new Project();
        project.setName(name);
        return project;
    }

    private User user(String email) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        return user;
    }
}

package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.SystemRole;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

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
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvitationService invitationService;

    @InjectMocks
    private UserService service;

    @Test
    void findOrProvisionUpdatesPlaceholderEmailForExistingUser() {
        User existing = user("temp@unknown");
        existing.setOciIamId("oci-user-1");

        when(userRepository.findByOciIamId("oci-user-1")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);

        User result = service.findOrProvision("oci-user-1", "ana@example.com");

        assertSame(existing, result);
        assertEquals("ana@example.com", existing.getEmail());
        verifyNoInteractions(invitationService);
    }

    @Test
    void findOrProvisionReturnsExistingUserWhenEmailIsKnown() {
        User existing = user("ana@example.com");
        existing.setOciIamId("oci-user-1");

        when(userRepository.findByOciIamId("oci-user-1")).thenReturn(Optional.of(existing));

        User result = service.findOrProvision("oci-user-1", "other@example.com");

        assertSame(existing, result);
        assertEquals("ana@example.com", existing.getEmail());
        verifyNoInteractions(invitationService);
    }

    @Test
    void findOrProvisionCreatesDeveloperAndFulfillsInvitationsForNewUser() {
        when(userRepository.findByOciIamId("oci-user-2")).thenReturn(Optional.empty());
        when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        User result = service.findOrProvision("oci-user-2", "baltazar@example.com");

        assertEquals("oci-user-2", result.getOciIamId());
        assertEquals("baltazar@example.com", result.getEmail());
        assertEquals(SystemRole.DEVELOPER, result.getSystemRole());
        verify(invitationService).fulfillForUser(result);
    }

    @Test
    void updateUserOnlyChangesProvidedFields() {
        UUID id = UUID.randomUUID();
        User existing = user("luis@example.com");
        existing.setTelegramChatId("old-chat");
        existing.setSystemRole(SystemRole.DEVELOPER);
        User updates = new User();
        updates.setTelegramChatId("new-chat");
        updates.setSystemRole(SystemRole.ADMIN);

        when(userRepository.findById(id)).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);

        User result = service.updateUser(id, updates);

        assertSame(existing, result);
        assertEquals("new-chat", existing.getTelegramChatId());
        assertEquals(SystemRole.ADMIN, existing.getSystemRole());
    }

    @Test
    void updateUserReturnsNullWhenUserDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertNull(service.updateUser(id, new User()));
    }

    @Test
    void getUserByIdReturnsOkOrNotFound() {
        UUID existingId = UUID.randomUUID();
        UUID missingId = UUID.randomUUID();
        User existing = user("ana@example.com");

        when(userRepository.findById(existingId)).thenReturn(Optional.of(existing));
        when(userRepository.findById(missingId)).thenReturn(Optional.empty());

        ResponseEntity<User> found = service.getUserById(existingId);
        ResponseEntity<User> missing = service.getUserById(missingId);

        assertEquals(HttpStatus.OK, found.getStatusCode());
        assertSame(existing, found.getBody());
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatusCode());
    }

    @Test
    void deleteReturnsTrueWhenRepositoryDoesNotThrow() {
        UUID successId = UUID.randomUUID();

        assertTrue(service.deleteUser(successId));
    }

    @Test
    void deleteReturnsFalseWhenRepositoryThrows() {
        UUID failureId = UUID.randomUUID();
        doThrow(new RuntimeException("database error")).when(userRepository).deleteById(failureId);

        assertFalse(service.deleteUser(failureId));
    }

    @Test
    void simpleFindAndSaveMethodsDelegateToRepository() {
        User user = user("ana@example.com");

        when(userRepository.findAll()).thenReturn(List.of(user));
        when(userRepository.findByTelegramChatId("chat-id")).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        assertEquals(List.of(user), service.findAll());
        assertEquals(Optional.of(user), service.findByTelegramChatId("chat-id"));
        assertEquals(Optional.of(user), service.findByEmail("ana@example.com"));
        assertSame(user, service.addUser(user));
    }

    private User user(String email) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        return user;
    }
}

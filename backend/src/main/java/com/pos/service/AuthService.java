package com.pos.service;

import com.pos.dto.AuthResponse;
import com.pos.dto.LoginRequest;
import com.pos.dto.RegisterRequest;
import com.pos.entity.Tenant;
import com.pos.entity.User;
import com.pos.repository.TenantRepository;
import com.pos.repository.UserRepository;
import com.pos.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Tenant tenant = Tenant.builder()
                .name(request.getTenantName())
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenant(tenant)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role("admin")
                .active(true)
                .build();
        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), tenant.getId(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .tenantId(tenant.getId())
                .tenantName(tenant.getName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(user.getId(), user.getTenant().getId(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .tenantId(user.getTenant().getId())
                .tenantName(user.getTenant().getName())
                .build();
    }
}
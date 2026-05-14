package com.pos.service;

import com.pos.dto.CategoryDTO;
import com.pos.entity.Category;
import com.pos.entity.Tenant;
import com.pos.repository.CategoryRepository;
import com.pos.repository.TenantRepository;
import com.pos.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final TenantRepository tenantRepository;

    public List<CategoryDTO> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return categoryRepository.findAll().stream()
                .filter(c -> c.getTenant().getId().equals(tenantId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CategoryDTO getById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        validateTenant(category.getTenant().getId());
        return toDTO(category);
    }

    public CategoryDTO create(CategoryDTO dto) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Category category = Category.builder()
                .tenant(tenant)
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
        category = categoryRepository.save(category);
        return toDTO(category);
    }

    public CategoryDTO update(UUID id, CategoryDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        validateTenant(category.getTenant().getId());

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category = categoryRepository.save(category);
        return toDTO(category);
    }

    public void delete(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        validateTenant(category.getTenant().getId());
        categoryRepository.delete(category);
    }

    private void validateTenant(UUID categoryTenantId) {
        UUID currentTenantId = TenantContext.getCurrentTenant();
        if (!currentTenantId.equals(categoryTenantId)) {
            throw new RuntimeException("Access denied");
        }
    }

    private CategoryDTO toDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}
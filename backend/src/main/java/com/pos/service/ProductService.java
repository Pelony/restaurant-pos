package com.pos.service;

import com.pos.dto.ProductDTO;
import com.pos.entity.Category;
import com.pos.entity.Product;
import com.pos.entity.Tenant;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.TenantRepository;
import com.pos.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final TenantRepository tenantRepository;

    public List<ProductDTO> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return productRepository.findAll().stream()
                .filter(p -> p.getTenant().getId().equals(tenantId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO getById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        validateTenant(product.getTenant().getId());
        return toDTO(product);
    }

    public ProductDTO create(ProductDTO dto) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Category category = null;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            validateTenant(category.getTenant().getId());
        }

        Product product = Product.builder()
                .tenant(tenant)
                .category(category)
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .imageUrl(dto.getImageUrl())
                .available(dto.getAvailable() != null ? dto.getAvailable() : true)
                .build();
        product = productRepository.save(product);
        return toDTO(product);
    }

    public ProductDTO update(UUID id, ProductDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        validateTenant(product.getTenant().getId());

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            validateTenant(category.getTenant().getId());
            product.setCategory(category);
        }

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setImageUrl(dto.getImageUrl());
        product.setAvailable(dto.getAvailable());
        product = productRepository.save(product);
        return toDTO(product);
    }

    public void delete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        validateTenant(product.getTenant().getId());
        productRepository.delete(product);
    }

    private void validateTenant(UUID productTenantId) {
        UUID currentTenantId = TenantContext.getCurrentTenant();
        if (!currentTenantId.equals(productTenantId)) {
            throw new RuntimeException("Access denied");
        }
    }

    private ProductDTO toDTO(Product product) {
        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .imageUrl(product.getImageUrl())
                .available(product.getAvailable())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .build();
    }
}
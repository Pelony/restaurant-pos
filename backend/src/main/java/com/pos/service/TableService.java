package com.pos.service;

import com.pos.dto.TableDTO;
import com.pos.entity.TableEntity;
import com.pos.entity.Tenant;
import com.pos.repository.TableRepository;
import com.pos.repository.TenantRepository;
import com.pos.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableService {
    private final TableRepository tableRepository;
    private final TenantRepository tenantRepository;

    public List<TableDTO> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return tableRepository.findAll().stream()
                .filter(t -> t.getTenant().getId().equals(tenantId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TableDTO getById(UUID id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        validateTenant(table.getTenant().getId());
        return toDTO(table);
    }

    public TableDTO create(TableDTO dto) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        TableEntity table = TableEntity.builder()
                .tenant(tenant)
                .number(dto.getNumber())
                .capacity(dto.getCapacity())
                .status("free")
                .build();
        table = tableRepository.save(table);
        return toDTO(table);
    }

    public TableDTO update(UUID id, TableDTO dto) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        validateTenant(table.getTenant().getId());

        table.setNumber(dto.getNumber());
        table.setCapacity(dto.getCapacity());
        if (dto.getStatus() != null) {
            table.setStatus(dto.getStatus());
        }
        table = tableRepository.save(table);
        return toDTO(table);
    }

    public void delete(UUID id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        validateTenant(table.getTenant().getId());
        tableRepository.delete(table);
    }

    private void validateTenant(UUID tableTenantId) {
        UUID currentTenantId = TenantContext.getCurrentTenant();
        if (!currentTenantId.equals(tableTenantId)) {
            throw new RuntimeException("Access denied");
        }
    }

    private TableDTO toDTO(TableEntity table) {
        return TableDTO.builder()
                .id(table.getId())
                .number(table.getNumber())
                .capacity(table.getCapacity())
                .status(table.getStatus())
                .build();
    }
}
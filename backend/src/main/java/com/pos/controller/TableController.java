package com.pos.controller;

import com.pos.dto.TableDTO;
import com.pos.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {
    private final TableService tableService;

    @GetMapping
    public ResponseEntity<List<TableDTO>> getAll() {
        return ResponseEntity.ok(tableService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TableDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(tableService.getById(id));
    }

    @PostMapping
    public ResponseEntity<TableDTO> create(@RequestBody TableDTO dto) {
        return ResponseEntity.ok(tableService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TableDTO> update(@PathVariable UUID id, @RequestBody TableDTO dto) {
        return ResponseEntity.ok(tableService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        tableService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
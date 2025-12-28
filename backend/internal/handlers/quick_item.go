package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jajanin/backend/internal/services"
	"github.com/jajanin/backend/internal/utils"
)

type QuickItemHandler struct {
	service *services.QuickItemService
}

func NewQuickItemHandler(service *services.QuickItemService) *QuickItemHandler {
	return &QuickItemHandler{service: service}
}

// GetByID retrieves a quick item by ID (public)
func (h *QuickItemHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequest(c, "ID tidak valid")
		return
	}

	item, err := h.service.GetByID(id)
	if err != nil {
		utils.NotFound(c, "Produk jajan tidak ditemukan")
		return
	}

	utils.Success(c, http.StatusOK, "", item)
}

// GetPublicItems retrieves all active global items (public)
func (h *QuickItemHandler) GetPublicItems(c *gin.Context) {
	items, err := h.service.GetActive()
	if err != nil {
		utils.NotFound(c, "Produk jajan tidak ditemukan")
		return
	}

	utils.Success(c, http.StatusOK, "", items)
}

// ========== ADMIN ONLY ==========

// Create creates a new quick item (admin only)
func (h *QuickItemHandler) Create(c *gin.Context) {
	var input services.CreateQuickItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Create(&input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("QuickItemHandler.Create", err, "Failed to create")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusCreated, "Produk jajan berhasil dibuat", item)
}

// GetAll retrieves all quick items (admin only)
func (h *QuickItemHandler) GetAll(c *gin.Context) {
	items, err := h.service.GetAll()
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("QuickItemHandler.GetAll", err, "Failed to get")
		utils.InternalError(c, "Gagal mengambil produk jajan")
		return
	}

	utils.Success(c, http.StatusOK, "", items)
}

// Update updates a quick item (admin only)
func (h *QuickItemHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequest(c, "ID tidak valid")
		return
	}

	var input services.UpdateQuickItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Update(id, &input)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("QuickItemHandler.Update", err, "Failed to update")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Produk jajan berhasil diupdate", item)
}

// Delete deletes a quick item (admin only)
func (h *QuickItemHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.BadRequest(c, "ID tidak valid")
		return
	}

	err = h.service.Delete(id)
	if err != nil {
		log := utils.GetLoggerFromContext(c)
		log.LogError("QuickItemHandler.Delete", err, "Failed to delete")
		utils.BadRequest(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, "Produk jajan berhasil dihapus", nil)
}

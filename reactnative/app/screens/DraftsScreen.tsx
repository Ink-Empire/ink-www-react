import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  TextInput,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { bulkUploadService, tagService } from '../../lib/services';
import { uploadImagesToS3, type ImageFile } from '../../lib/s3Upload';
import { useStyles, useTags, usePlacements } from '@inkedin/shared/hooks';
import MultiSelectPicker from '../components/common/MultiSelectPicker';
import { useSnackbar } from '../contexts/SnackbarContext';
import type { BulkUploadItem, BulkUpload } from '@inkedin/shared/services/bulkUploadService';

const screenWidth = Dimensions.get('window').width;
const GRID_COLUMNS = 3;
const GRID_GAP = 4;
const THUMB_SIZE = (screenWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export default function DraftsScreen({ navigation, route }: any) {
  const [uploads, setUploads] = useState<BulkUpload[]>([]);
  const [items, setItems] = useState<BulkUploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<BulkUploadItem | null>(null);
  const [publishing, setPublishing] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { styles: stylesList } = useStyles(api);
  const { tags: tagsList } = useTags(api);
  const { placements } = usePlacements(api);

  // Selection state for bulk operations
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Edit state for selected item
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlacementId, setEditPlacementId] = useState<number | null>(null);
  const [editStyleId, setEditStyleId] = useState<number | null>(null);
  const [editApprovedTags, setEditApprovedTags] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [showTagsPicker, setShowTagsPicker] = useState(false);
  const [createdTags, setCreatedTags] = useState<{ id: number; name: string }[]>([]);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bulkUploadService.list();
      const uploadList = (response as any)?.data ?? [];
      const activeUploads = uploadList.filter(
        (u: BulkUpload) => u.status !== 'completed' && u.status !== 'failed' && u.status !== 'deleting',
      );
      setUploads(activeUploads);

      const allItems: BulkUploadItem[] = [];
      for (const upload of activeUploads) {
        const itemsResponse = await bulkUploadService.getItems(upload.id, {
          filter: 'unpublished',
          primaryOnly: true,
          perPage: 100,
        });
        const itemData = (itemsResponse as any)?.data ?? [];
        allItems.push(...itemData);
      }
      setItems(allItems);
    } catch (err) {
      console.error('Failed to fetch drafts:', err);
      showSnackbar('Failed to load drafts', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const openEditModal = useCallback((item: BulkUploadItem) => {
    setSelectedItem(item);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditPlacementId(item.placement_id);

    // Pre-select from AI suggestions if user hasn't manually set values
    const styleId = item.primary_style_id
      ?? (item.ai_suggested_styles?.length ? item.ai_suggested_styles[0].id : null);
    setEditStyleId(styleId);

    const tagIds = item.approved_tag_ids?.length
      ? item.approved_tag_ids
      : (item.ai_suggested_tags?.filter(t => t.id != null).map(t => t.id!) ?? []);
    setEditApprovedTags(tagIds);
  }, []);

  const handleSaveItem = useCallback(async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await bulkUploadService.updateItem(selectedItem.bulk_upload_id, selectedItem.id, {
        title: editTitle || null,
        description: editDescription || null,
        placement_id: editPlacementId,
        primary_style_id: editStyleId,
        approved_tag_ids: editApprovedTags,
      });

      setItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? {
                ...item,
                title: editTitle || null,
                description: editDescription || null,
                placement_id: editPlacementId,
                primary_style_id: editStyleId,
                approved_tag_ids: editApprovedTags,
                is_edited: true,
              }
            : item,
        ),
      );

      setSelectedItem(null);
      showSnackbar('Draft updated');
    } catch (err) {
      console.error('Failed to save item:', err);
      showSnackbar('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  }, [selectedItem, editTitle, editDescription, editPlacementId, editStyleId, editApprovedTags, showSnackbar]);

  const handleApproveStyleSuggestion = useCallback((styleId: number) => {
    setEditStyleId(styleId);
  }, []);

  const handleApproveTagSuggestion = useCallback((tagId: number) => {
    setEditApprovedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId],
    );
  }, []);

  const handleCreateTag = useCallback(async (name: string) => {
    try {
      const response = await tagService.create(name);
      if (response.success && response.data) {
        const newTag = response.data;
        setCreatedTags(prev => [...prev, { id: newTag.id, name: newTag.name }]);
        return { id: newTag.id, name: newTag.name };
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to create tag', 'error');
    }
    return null;
  }, [showSnackbar]);

  const handleCropImage = useCallback(async () => {
    if (!selectedItem?.thumbnail_url) return;
    try {
      const cropped = await ImageCropPicker.openCropper({
        path: selectedItem.thumbnail_url,
        freeStyleCropEnabled: true,
        compressImageQuality: 0.8,
        forceJpg: true,
      });

      const imageFile: ImageFile = {
        uri: cropped.path,
        type: cropped.mime || 'image/jpeg',
        name: cropped.filename || `cropped_${Date.now()}.jpg`,
      };

      const uploaded = await uploadImagesToS3(api, [imageFile], 'tattoo');
      const newImageId = uploaded[0].id;
      const newUri = uploaded[0].uri;

      await bulkUploadService.updateItem(selectedItem.bulk_upload_id, selectedItem.id, {
        image_id: newImageId,
      });

      setItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? { ...item, image_id: newImageId, thumbnail_url: newUri }
            : item,
        ),
      );
      setSelectedItem(prev => prev ? { ...prev, image_id: newImageId, thumbnail_url: newUri } : null);
      showSnackbar('Image updated');
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') {
        console.error('Crop error:', err);
        showSnackbar('Failed to update image', 'error');
      }
    }
  }, [selectedItem, showSnackbar]);

  const handlePublishAll = useCallback(async () => {
    const readyUploads = uploads.filter(u => u.can_publish);
    if (readyUploads.length === 0) {
      showSnackbar('No items are ready to publish. Add style and placement to drafts first.', 'error');
      return;
    }

    setPublishing(true);
    try {
      for (const upload of readyUploads) {
        await bulkUploadService.publish(upload.id);
      }
      showSnackbar('Publishing drafts...');
      const remaining = items.filter(item => !item.is_ready_for_publish);
      if (remaining.length === 0) {
        navigation.goBack();
      } else {
        setItems(remaining);
      }
    } catch (err) {
      console.error('Failed to publish:', err);
      showSnackbar('Failed to publish', 'error');
      await fetchDrafts();
    } finally {
      setPublishing(false);
    }
  }, [uploads, showSnackbar, fetchDrafts]);

  const handlePublishAllNow = useCallback(() => {
    Alert.alert(
      'Publish All Drafts',
      'If you have not set details like title, description, or placement, they will be published without them. You can always edit later from your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish All',
          onPress: async () => {
            setPublishing(true);
            try {
              const results = await Promise.allSettled(
                uploads.map(upload => bulkUploadService.publishAll(upload.id)),
              );
              const anyPublished = results.some(
                r => r.status === 'fulfilled' && (r.value as any)?.count > 0,
              );
              if (anyPublished) {
                showSnackbar('Publishing all drafts...');
                navigation.goBack();
              } else {
                showSnackbar('No drafts to publish');
              }
            } catch (err) {
              console.error('Failed to publish all:', err);
              showSnackbar('Failed to publish', 'error');
              await fetchDrafts();
            } finally {
              setPublishing(false);
            }
          },
        },
      ],
    );
  }, [uploads, showSnackbar, fetchDrafts]);

  const handleDeleteItem = useCallback((item: BulkUploadItem) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await bulkUploadService.updateItem(item.bulk_upload_id, item.id, {
                is_skipped: true,
              });
              setItems(prev => prev.filter(i => i.id !== item.id));
              setSelectedItem(null);
              showSnackbar('Draft deleted');
            } catch (err) {
              showSnackbar('Failed to delete draft', 'error');
            }
          },
        },
      ],
    );
  }, [showSnackbar]);

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(prev => prev.size === items.length ? new Set() : new Set(items.map(i => i.id)));
  }, [items]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      `Delete ${selectedIds.size} draft${selectedIds.size > 1 ? 's' : ''}?`,
      'This will skip the selected drafts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBulkDeleting(true);
            try {
              // Group selected items by bulk_upload_id
              const grouped: Record<number, number[]> = {};
              for (const item of items) {
                if (selectedIds.has(item.id)) {
                  if (!grouped[item.bulk_upload_id]) grouped[item.bulk_upload_id] = [];
                  grouped[item.bulk_upload_id].push(item.id);
                }
              }

              await Promise.all(
                Object.entries(grouped).map(([uploadId, itemIds]) =>
                  bulkUploadService.batchUpdateItems(Number(uploadId), itemIds, { is_skipped: true }),
                ),
              );

              setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
              showSnackbar(`Deleted ${selectedIds.size} draft${selectedIds.size > 1 ? 's' : ''}`);
              setSelectMode(false);
              setSelectedIds(new Set());
            } catch (err) {
              console.error('Bulk delete failed:', err);
              showSnackbar('Failed to delete drafts', 'error');
            } finally {
              setBulkDeleting(false);
            }
          },
        },
      ],
    );
  }, [selectedIds, items, showSnackbar]);

  const renderItem = useCallback(({ item }: { item: BulkUploadItem }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[gridStyles.item, selectMode && isSelected && gridStyles.itemSelected]}
        onPress={() => {
          if (selectMode) {
            toggleSelected(item.id);
          } else {
            openEditModal(item);
          }
        }}
        onLongPress={() => {
          if (!selectMode) {
            setSelectMode(true);
            setSelectedIds(new Set([item.id]));
          }
        }}
        activeOpacity={0.7}
      >
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={gridStyles.image} />
        ) : (
          <View style={[gridStyles.image, gridStyles.placeholder]}>
            <MaterialIcons name="image" size={24} color={colors.textMuted} />
          </View>
        )}
        {!selectMode && item.is_ready_for_publish && (
          <View style={gridStyles.readyBadge}>
            <MaterialIcons name="check" size={12} color={colors.background} />
          </View>
        )}
        {selectMode && (
          <View style={gridStyles.checkOverlay}>
            <View style={[gridStyles.checkbox, isSelected && gridStyles.checkboxSelected]}>
              {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [openEditModal, selectMode, selectedIds, toggleSelected]);

  if (loading) {
    return (
      <View style={localStyles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={localStyles.centered}>
        <MaterialIcons name="collections" size={48} color={colors.textMuted} />
        <Text style={localStyles.emptyText}>No drafts</Text>
        <Text style={localStyles.emptySubtext}>
          Upload photos from your album to create drafts
        </Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <View style={localStyles.blurb}>
        <Text style={localStyles.blurbText}>
          Tap each photo to add a style and placement, then publish to show it on your profile.
        </Text>
      </View>

      {selectMode ? (
        <View style={localStyles.selectBar}>
          <TouchableOpacity onPress={selectAll} activeOpacity={0.7}>
            <Text style={localStyles.selectBarLink}>
              {selectedIds.size === items.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <View style={localStyles.selectBarRight}>
            {selectedIds.size > 0 && (
              <TouchableOpacity
                style={localStyles.deleteBtn}
                onPress={handleBulkDelete}
                disabled={bulkDeleting}
                activeOpacity={0.7}
              >
                <MaterialIcons name="delete-outline" size={18} color="#fff" />
                <Text style={localStyles.deleteBtnText}>
                  {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleSelectMode} activeOpacity={0.7}>
              <Text style={localStyles.selectBarLink}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={localStyles.topBar}>
          <Text style={localStyles.countText}>{items.length} drafts</Text>
          <View style={localStyles.topBarActions}>
            <TouchableOpacity onPress={toggleSelectMode} activeOpacity={0.7}>
              <Text style={localStyles.selectBarLink}>Select</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[localStyles.publishAllNowBtn, publishing && localStyles.btnDisabled]}
              onPress={handlePublishAllNow}
              disabled={publishing}
            >
              <Text style={localStyles.publishAllNowText}>Publish All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[localStyles.publishAllBtn, publishing && localStyles.btnDisabled]}
              onPress={handlePublishAll}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={localStyles.publishAllText}>Publish Ready</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={gridStyles.row}
      />

      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedItem(null)}
      >
        {selectedItem && (
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={modalStyles.headerTitle}>Edit Draft</Text>
              <TouchableOpacity onPress={handleSaveItem} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Text style={modalStyles.saveBtn}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={modalStyles.body} keyboardShouldPersistTaps="handled">
              {selectedItem.thumbnail_url && (
                <View style={modalStyles.previewContainer}>
                  <Image
                    source={{ uri: selectedItem.thumbnail_url }}
                    style={modalStyles.previewImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={modalStyles.cropBtn}
                    onPress={handleCropImage}
                  >
                    <MaterialIcons name="crop-rotate" size={18} color={colors.textPrimary} />
                    <Text style={modalStyles.cropBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* AI Suggested Styles */}
              {selectedItem.ai_suggested_styles && selectedItem.ai_suggested_styles.length > 0 && (
                <View style={modalStyles.section}>
                  <View style={modalStyles.aiHeader}>
                    <MaterialIcons name="auto-awesome" size={14} color={colors.aiSuggestion} />
                    <Text style={modalStyles.aiHeaderText}>SUGGESTED STYLES</Text>
                  </View>
                  <View style={modalStyles.chipRow}>
                    {selectedItem.ai_suggested_styles.map(style => (
                      <TouchableOpacity
                        key={style.id}
                        style={[
                          modalStyles.chip,
                          editStyleId === style.id && modalStyles.chipSelected,
                        ]}
                        onPress={() => handleApproveStyleSuggestion(style.id)}
                      >
                        <Text
                          style={[
                            modalStyles.chipText,
                            editStyleId === style.id && modalStyles.chipTextSelected,
                          ]}
                        >
                          {style.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* AI Suggested Tags */}
              {selectedItem.ai_suggested_tags && selectedItem.ai_suggested_tags.length > 0 && (
                <View style={modalStyles.section}>
                  <View style={modalStyles.aiHeader}>
                    <MaterialIcons name="auto-awesome" size={14} color={colors.aiSuggestion} />
                    <Text style={modalStyles.aiHeaderText}>SUGGESTED TAGS</Text>
                  </View>
                  <View style={modalStyles.chipRow}>
                    {selectedItem.ai_suggested_tags.map((tag, idx) => {
                      const tagId = tag.id;
                      const isApproved = tagId ? editApprovedTags.includes(tagId) : false;
                      return (
                        <TouchableOpacity
                          key={tagId ?? `tag-${idx}`}
                          style={[
                            modalStyles.chip,
                            modalStyles.tagChip,
                            isApproved && modalStyles.tagChipSelected,
                          ]}
                          onPress={() => tagId && handleApproveTagSuggestion(tagId)}
                          disabled={!tagId}
                        >
                          <Text
                            style={[
                              modalStyles.chipText,
                              modalStyles.tagChipText,
                              isApproved && modalStyles.tagChipTextSelected,
                            ]}
                          >
                            {tag.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={modalStyles.section}>
                <Text style={modalStyles.label}>Title</Text>
                <TextInput
                  style={modalStyles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Name your tattoo"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={modalStyles.section}>
                <Text style={modalStyles.label}>Description</Text>
                <TextInput
                  style={[modalStyles.input, modalStyles.textArea]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Tell the story behind this tattoo..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={modalStyles.section}>
                <Text style={modalStyles.label}>Style</Text>
                <View style={modalStyles.chipRow}>
                  {stylesList.map(style => (
                    <TouchableOpacity
                      key={style.id}
                      style={[
                        modalStyles.chip,
                        editStyleId === style.id && modalStyles.chipSelected,
                      ]}
                      onPress={() => setEditStyleId(style.id)}
                    >
                      <Text
                        style={[
                          modalStyles.chipText,
                          editStyleId === style.id && modalStyles.chipTextSelected,
                        ]}
                      >
                        {style.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={modalStyles.section}>
                <Text style={modalStyles.label}>Tags</Text>
                {editApprovedTags.length > 0 && (
                  <View style={modalStyles.selectedTagsRow}>
                    {editApprovedTags.map(id => {
                      const tag = tagsList.find((t: any) => t.id === id)
                        || createdTags.find(t => t.id === id)
                        || selectedItem.ai_suggested_tags?.find(t => t.id === id);
                      if (!tag) return null;
                      return (
                        <TouchableOpacity
                          key={id}
                          style={modalStyles.selectedTagChip}
                          onPress={() => handleApproveTagSuggestion(id)}
                        >
                          <Text style={modalStyles.selectedTagChipText}>{tag.name}</Text>
                          <MaterialIcons name="close" size={14} color={colors.tag} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <TouchableOpacity
                  style={modalStyles.pickerButton}
                  onPress={() => setShowTagsPicker(true)}
                >
                  <Text style={editApprovedTags.length > 0 ? modalStyles.pickerText : modalStyles.pickerPlaceholder}>
                    {editApprovedTags.length > 0 ? `${editApprovedTags.length} selected` : 'Select tags'}
                  </Text>
                  <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={modalStyles.section}>
                <Text style={modalStyles.label}>Placement</Text>
                <TouchableOpacity
                  style={modalStyles.pickerButton}
                  onPress={() => setShowPlacementPicker(true)}
                >
                  <Text style={editPlacementId ? modalStyles.pickerText : modalStyles.pickerPlaceholder}>
                    {placements.find(p => p.id === editPlacementId)?.name || 'Select placement'}
                  </Text>
                  <MaterialIcons name="expand-more" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Modal visible={showPlacementPicker} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={pickerStyles.container}>
                  <View style={pickerStyles.header}>
                    <Text style={pickerStyles.title}>Select Placement</Text>
                    <TouchableOpacity onPress={() => setShowPlacementPicker(false)}>
                      <MaterialIcons name="close" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {placements.map(placement => (
                      <TouchableOpacity
                        key={placement.id}
                        style={[
                          pickerStyles.option,
                          editPlacementId === placement.id && pickerStyles.optionSelected,
                        ]}
                        onPress={() => { setEditPlacementId(placement.id); setShowPlacementPicker(false); }}
                      >
                        <Text
                          style={[
                            pickerStyles.optionText,
                            editPlacementId === placement.id && pickerStyles.optionTextSelected,
                          ]}
                        >
                          {placement.name}
                        </Text>
                        {editPlacementId === placement.id && (
                          <MaterialIcons name="check" size={20} color={colors.accent} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </SafeAreaView>
              </Modal>

              <MultiSelectPicker
                visible={showTagsPicker}
                title="Select Tags"
                options={[...tagsList, ...createdTags.filter(ct => !tagsList.some((t: any) => t.id === ct.id))]}
                selected={editApprovedTags}
                onToggle={handleApproveTagSuggestion}
                onClose={() => setShowTagsPicker(false)}
                searchPlaceholder="Search tags..."
                initialDisplayCount={30}
                onCreateNew={handleCreateTag}
              />

              <TouchableOpacity
                style={modalStyles.skipBtn}
                onPress={() => handleDeleteItem(selectedItem)}
              >
                <MaterialIcons name="delete-outline" size={16} color={colors.error} />
                <Text style={modalStyles.skipBtnText}>Delete this draft</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  blurb: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  blurbText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  publishAllNowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  publishAllNowText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  publishAllBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  publishAllText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selectBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectBarLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

const gridStyles = StyleSheet.create({
  row: {
    gap: GRID_GAP,
  },
  item: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginBottom: GRID_GAP,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceElevated,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSelected: {
    opacity: 0.7,
  },
  checkOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  saveBtn: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
  },
  cropBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cropBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiHeaderText: {
    color: colors.aiSuggestion,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  tagChip: {
    borderColor: colors.tagDim,
  },
  tagChipSelected: {
    borderColor: colors.tag,
    backgroundColor: colors.tagDim,
  },
  tagChipText: {
    color: colors.textSecondary,
  },
  tagChipTextSelected: {
    color: colors.tag,
    fontWeight: '600',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  skipBtnText: {
    color: colors.error,
    fontSize: 14,
  },
  selectedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.tag,
    backgroundColor: colors.tagDim,
  },
  selectedTagChipText: {
    color: colors.tag,
    fontSize: 13,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
  },
  pickerText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
  },
});

const pickerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.accentDim,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
});

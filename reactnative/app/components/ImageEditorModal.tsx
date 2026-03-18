import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { buildImgixUrl } from '@inkedin/shared/utils/imgix';
import { imageService } from '../../lib/services';
import type { ImageEditParams } from '@inkedin/shared/types';

interface ImageEditorModalProps {
  isOpen: boolean;
  image: { id: number; uri: string; edit_params?: ImageEditParams | null } | null;
  onClose: () => void;
  onSave: (imageId: number, editParams: ImageEditParams) => void;
}

const DEFAULT_PARAMS: ImageEditParams = {
  bri: 0,
  con: 0,
  sat: 0,
  sharp: 0,
  sepia: 0,
  hue_shift: 0,
  rot: 0,
  mono: false,
  auto_enhance: false,
};

const GOLD = '#C9A962';
const BG = '#0F0F0F';
const SURFACE = '#1A1A1A';
const BORDER = '#2D2D2D';
const TEXT = '#F5F4F0';
const TEXT_SECONDARY = '#A3A299';
const TEXT_MUTED = '#6B6B63';

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  image,
  onClose,
  onSave,
}) => {
  const [params, setParams] = useState<ImageEditParams>(DEFAULT_PARAMS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (image?.edit_params) {
      setParams({ ...DEFAULT_PARAMS, ...image.edit_params });
    } else {
      setParams(DEFAULT_PARAMS);
    }
    setError(null);
  }, [image]);

  const updateParam = useCallback((key: keyof ImageEditParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRotate = useCallback(() => {
    setParams(prev => ({
      ...prev,
      rot: (((prev.rot || 0) + 90) % 360) as 0 | 90 | 180 | 270,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  const handleSave = async () => {
    if (!image) return;
    setSaving(true);
    setError(null);
    try {
      await imageService.updateEditParams(image.id, params);
      onSave(image.id, params);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save edits');
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = image?.uri ? buildImgixUrl(image.uri, params) : '';

  if (!image) return null;

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Photo</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={GOLD} />
            ) : (
              <Text style={[styles.headerButton, { color: GOLD }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.preview}>
          {previewUrl ? (
            <Image
              source={{ uri: previewUrl }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Controls */}
        <ScrollView style={styles.controls} contentContainerStyle={styles.controlsContent}>
          <SliderControl
            label="Brightness"
            value={params.bri || 0}
            min={-100}
            max={100}
            onValueChange={(v) => updateParam('bri', Math.round(v))}
          />
          <SliderControl
            label="Contrast"
            value={params.con || 0}
            min={-100}
            max={100}
            onValueChange={(v) => updateParam('con', Math.round(v))}
          />
          <SliderControl
            label="Saturation"
            value={params.sat || 0}
            min={-100}
            max={100}
            onValueChange={(v) => updateParam('sat', Math.round(v))}
          />
          <SliderControl
            label="Sharpness"
            value={params.sharp || 0}
            min={0}
            max={100}
            onValueChange={(v) => updateParam('sharp', Math.round(v))}
          />
          <SliderControl
            label="Sepia"
            value={params.sepia || 0}
            min={0}
            max={100}
            onValueChange={(v) => updateParam('sepia', Math.round(v))}
          />
          <SliderControl
            label="Hue Shift"
            value={params.hue_shift || 0}
            min={0}
            max={359}
            onValueChange={(v) => updateParam('hue_shift', Math.round(v))}
          />

          {/* Rotation */}
          <View style={styles.row}>
            <Text style={styles.label}>Rotation: {params.rot || 0}</Text>
            <TouchableOpacity onPress={handleRotate} style={styles.rotateButton}>
              <Text style={styles.rotateText}>+90</Text>
            </TouchableOpacity>
          </View>

          {/* B&W */}
          <View style={styles.row}>
            <Text style={styles.label}>Black & White</Text>
            <Switch
              value={params.mono || false}
              onValueChange={(v) => updateParam('mono', v)}
              trackColor={{ false: BORDER, true: GOLD }}
              thumbColor={TEXT}
            />
          </View>

          {/* Auto-enhance */}
          <View style={styles.row}>
            <Text style={styles.label}>Auto-enhance</Text>
            <Switch
              value={params.auto_enhance || false}
              onValueChange={(v) => updateParam('auto_enhance', v)}
              trackColor={{ false: BORDER, true: GOLD }}
              thumbColor={TEXT}
            />
          </View>

          {/* Reset */}
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, value, min, max, onValueChange }) => (
  <View style={styles.sliderContainer}>
    <View style={styles.sliderHeader}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
    <Slider
      value={value}
      minimumValue={min}
      maximumValue={max}
      step={1}
      onValueChange={onValueChange}
      minimumTrackTintColor={GOLD}
      maximumTrackTintColor={BORDER}
      thumbTintColor={GOLD}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '600',
  },
  headerButton: {
    color: TEXT_SECONDARY,
    fontSize: 16,
  },
  preview: {
    height: 300,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  error: {
    color: '#E5534B',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  controls: {
    flex: 1,
  },
  controlsContent: {
    padding: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  value: {
    color: TEXT_MUTED,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  rotateButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 6,
  },
  rotateText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetText: {
    color: TEXT_SECONDARY,
    fontSize: 15,
  },
});

export default ImageEditorModal;

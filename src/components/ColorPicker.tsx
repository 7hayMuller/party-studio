import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  SafeAreaView, TouchableWithoutFeedback,
} from 'react-native';
import WheelColorPicker from 'react-native-wheel-color-picker';

interface Props {
  label: string;
  value: string;
  aiMode: boolean;
  onChangeColor: (color: string) => void;
  onToggleAi: (ai: boolean) => void;
}

export default function ColorPicker({ label, value, aiMode, onChangeColor, onToggleAi }: Props) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState(value);

  const confirm = () => { onChangeColor(temp); setOpen(false); };

  return (
    <>
      <View style={s.row}>
        <Text style={s.label}>{label}</Text>
        <TouchableOpacity
          style={[s.aiToggle, aiMode && s.aiToggleActive]}
          onPress={() => onToggleAi(!aiMode)}
        >
          <Text style={[s.aiTxt, aiMode && s.aiTxtActive]}>
            {aiMode ? '✦ IA escolhe!' : '✦ Deixar com a IA'}
          </Text>
        </TouchableOpacity>
      </View>

      {aiMode ? (
        <View style={s.aiPlaceholder}>
          <Text style={s.aiPlaceholderTxt}>A IA vai definir essa cor automaticamente</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.swatchRow, { borderColor: value + '88' }]}
          onPress={() => { setTemp(value); setOpen(true); }}
          activeOpacity={0.8}
        >
          <View style={[s.swatch, { backgroundColor: value }]} />
          <Text style={s.hexTxt}>{value}</Text>
          <Text style={s.editTxt}>toque para editar →</Text>
        </TouchableOpacity>
      )}

      <Modal visible={open} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={s.overlay} />
        </TouchableWithoutFeedback>

        <View style={s.sheet}>
          <SafeAreaView>
            <Text style={s.sheetTitle}>{label}</Text>
            <View style={s.wheel}>
              <WheelColorPicker
                color={temp}
                onColorChange={setTemp}
                thumbSize={28}
                sliderSize={28}
                noSnap
                row={false}
              />
            </View>
            <View style={s.footer}>
              <View style={[s.preview, { backgroundColor: temp }]} />
              <Text style={s.hex}>{temp}</Text>
              <TouchableOpacity style={s.btn} onPress={confirm}>
                <Text style={s.btnTxt}>CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  row:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label:           { fontSize: 9, letterSpacing: 2, color: '#555', flex: 1 },
  aiToggle:        { borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  aiToggleActive:  { borderColor: '#6366f1', backgroundColor: '#6366f110' },
  aiTxt:           { fontSize: 10, color: '#555', letterSpacing: 1 },
  aiTxtActive:     { color: '#818cf8' },

  swatchRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#111', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  swatch:      { width: 32, height: 32, borderRadius: 16 },
  hexTxt:      { fontSize: 13, color: '#fff', flex: 1 },
  editTxt:     { fontSize: 10, color: '#444' },

  aiPlaceholder:    { backgroundColor: '#111', borderWidth: 1, borderColor: '#1e1e2e', borderRadius: 10, padding: 14, marginBottom: 14, alignItems: 'center' },
  aiPlaceholderTxt: { fontSize: 11, color: '#555', fontStyle: 'italic' },

  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 0 },
  sheetTitle: { fontSize: 10, letterSpacing: 4, color: '#666', textAlign: 'center', marginBottom: 20 },
  wheel:      { height: 300 },
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20 },
  preview:    { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#333' },
  hex:        { flex: 1, fontSize: 14, color: '#fff' },
  btn:        { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  btnTxt:     { fontSize: 11, fontWeight: '700', color: '#000', letterSpacing: 2 },
});

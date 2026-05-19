import pandas as pd
import json

def convertir_a_json(archivo_entrada, archivo_salida):
    try:
        # Leemos el archivo. Si es un Excel renombrado a CSV, pandas lo detecta.
        # Usamos engine='openpyxl' porque tu archivo es un Excel moderno.
        df = pd.read_excel(archivo_entrada, engine='openpyxl')
        
        # Limpiamos nombres de columnas (quitar espacios raros y pasarlas a mayúsculas por seguridad)
        df.columns = [str(c).strip().upper() for c in df.columns]
        
        # Filtrar solo filas que tengan nombre de ejercicio
        if 'NOMBRE' in df.columns:
            df = df[df['NOMBRE'].notna()]
        else:
            print("⚠️ Error: No se encontró la columna 'NOMBRE' en el Excel.")
            return
        
        data = []
        for _, row in df.iterrows():
            
            # --- 1. PROCESAMIENTO SEGURO DE NÚMEROS ---
            # Subdivisión (Por defecto 1 si está vacío)
            sub_raw = str(row.get('SUBDIVISIÓN', row.get('SUBDIVISION', '1'))).strip()
            try:
                sub_num = int(float(sub_raw)) if sub_raw.lower() != 'nan' and sub_raw else 1
            except ValueError:
                sub_num = 1

            # BPM Recomendado (Por defecto 60 si está vacío)
            bpm_raw = str(row.get('BPM_RECOMENDADO', '60')).strip()
            try:
                bpm_num = int(float(bpm_raw)) if bpm_raw.lower() != 'nan' and bpm_raw else 60
            except ValueError:
                bpm_num = 60

            # --- 2. PROCESAMIENTO DE OBJETIVOS ---
            objetivos_brutos = [
                str(row.get('OBJETIVO 1', '')).strip(),
                str(row.get('OBJETIVO 2', '')).strip(),
                str(row.get('OBJETIVO 3', '')).strip()
            ]
            # Limpiamos los que estén vacíos o pongan "nan"
            objetivos_limpios = [obj for obj in objetivos_brutos if obj.lower() != 'nan' and obj]

            # --- 3. CONSTRUCCIÓN DEL DICCIONARIO ---
            ejercicio = {
                "id": str(row.get('CÓDIGO', '')).strip(),
                "title": str(row.get('NOMBRE', '')).strip(),
                "repetitions": str(row.get('REPETICIONES', '')).strip(),
                "mainTechnique": str(row.get('PRINCIPAL', '')).strip(),
                "secondaryTechnique": str(row.get('SECUNDARIA', '')).strip(),
                "level": str(row.get('NIVEL', '')).strip(),
                "duration": str(row.get('DURACIÓN', row.get('DURACION', ''))).strip(),
                "description": str(row.get('DESCRIPCIÓN', row.get('DESCRIPCION', ''))).strip(),
                "objectives": objetivos_limpios,
                "pdfUrl": f"/pdfs/{str(row.get('CÓDIGO', '')).strip()}.pdf",
                
                # --- NUEVAS COLUMNAS DE LA ARQUITECTURA ---
                "subdivision": sub_num,
                "collection": str(row.get('COLECCIÓN', row.get('COLECCION', 'General'))).strip(),
                "videoId": str(row.get('VIDEO_ID', '')).strip(),
                "recommendedBpm": bpm_num
            }
            
            # Repaso final: Si pandas ha colado la palabra "nan" en algún texto, la vaciamos
            for key, value in ejercicio.items():
                if isinstance(value, str) and value.lower() == 'nan':
                    ejercicio[key] = ""
            
            data.append(ejercicio)

        # Guardar en JSON
        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        print(f"¡EUREKA! Se han procesado {len(data)} ejercicios correctamente con su nueva arquitectura.")

    except Exception as e:
        print(f"Error crítico: {e}")

# Ejecutar
convertir_a_json('ejercicios.csv', '../src/data/exercises.json')
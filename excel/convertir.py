import pandas as pd
import json

def convertir_a_json(archivo_entrada, archivo_salida):
    try:
        df = pd.read_excel(archivo_entrada, engine='openpyxl')
        
        # Limpiamos nombres de columnas
        df.columns = [str(c).strip().upper() for c in df.columns]
        
        # Buscamos la columna del título (ya sea TITULO o NOMBRE)
        col_titulo = 'TITULO' if 'TITULO' in df.columns else 'NOMBRE'
        
        if col_titulo in df.columns:
            df = df[df[col_titulo].notna()]
        else:
            print(f"⚠️ Error: No se encontró la columna '{col_titulo}' en el Excel.")
            return
        
        data = []
        for _, row in df.iterrows():
            
            sub_raw = str(row.get('SUBDIVISION', row.get('SUBDIVISIÓN', '1'))).strip()
            sub_num = int(float(sub_raw)) if sub_raw.lower() != 'nan' and sub_raw else 1

            bpm_raw = str(row.get('BPM_RECOMENDADO', '60')).strip()
            bpm_num = int(float(bpm_raw)) if bpm_raw.lower() != 'nan' and bpm_raw else 60

            objetivos_brutos = [
                str(row.get('OBJETIVO1', row.get('OBJETIVO 1', ''))).strip(),
                str(row.get('OBJETIVO2', row.get('OBJETIVO 2', ''))).strip(),
                str(row.get('OBJETIVO3', row.get('OBJETIVO 3', ''))).strip()
            ]
            objetivos_limpios = [obj for obj in objetivos_brutos if obj.lower() != 'nan' and obj]

           # Extraemos el ID y si Excel lo ha exportado como un decimal (ej: 1101.0), le quitamos el .0 de cuajo
            id_raw = str(row.get('ID', row.get('CÓDIGO', ''))).strip()
            id_ejercicio = id_raw.split('.')[0] if id_raw.endswith('.0') else id_raw
            
            ejercicio = {
                "id": id_ejercicio,
                "title": str(row.get('TITULO', row.get('NOMBRE', ''))).strip(),
                "repetitions": str(row.get('REPETICIONES', '')).strip(),
                "mainTechnique": str(row.get('TECNICA', row.get('PRINCIPAL', ''))).strip(),
                "secondaryTechnique": str(row.get('SECUNDARIA', '')).strip(),
                "level": str(row.get('NIVEL', '')).strip(),
                "duration": str(row.get('TIEMPO', row.get('DURACIÓN', ''))).strip(),
                "description": str(row.get('DESCRIPCION', row.get('DESCRIPCIÓN', ''))).strip(),
                "objectives": objetivos_limpios,
                "pdfUrl": f"/pdfs/{id_ejercicio}.pdf",
                "subdivision": sub_num,
                "collection": str(row.get('COLECCION', row.get('COLECCIÓN', 'General'))).strip(),
                "videoId": str(row.get('VIDEO_ID', '')).strip(),
                "recommendedBpm": bpm_num
            }
            
            for key, value in ejercicio.items():
                if isinstance(value, str) and value.lower() == 'nan':
                    ejercicio[key] = ""
            
            data.append(ejercicio)

        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        print(f"¡EUREKA! Se han procesado {len(data)} ejercicios correctamente.")

    except Exception as e:
        print(f"Error crítico: {e}")

convertir_a_json('ejercicios.csv', '../src/data/exercises.json')
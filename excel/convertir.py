import pandas as pd
import json

def convertir_a_json(archivo_entrada, archivo_salida):
    try:
        # Leemos el archivo. Si es un Excel renombrado a CSV, pandas lo detecta.
        # Usamos engine='openpyxl' porque tu archivo es un Excel moderno.
        df = pd.read_excel(archivo_entrada, engine='openpyxl')
        
        # Limpiamos nombres de columnas (quitar espacios raros)
        df.columns = [str(c).strip() for c in df.columns]
        
        # Filtrar solo filas que tengan nombre de ejercicio
        df = df[df['NOMBRE'].notna()]
        
        data = []
        for _, row in df.iterrows():
            ejercicio = {
                "id": str(row.get('CÓDIGO', '')),
                "title": str(row.get('NOMBRE', '')),
                "repetitions": str(row.get('REPETICIONES', '')),
                "mainTechnique": str(row.get('PRINCIPAL', '')),
                "secondaryTechnique": str(row.get('SECUNDARIA', '')),
                "level": str(row.get('NIVEL', '')),
                "duration": str(row.get('DURACIÓN', '')),
                "description": str(row.get('DESCRIPCIÓN', '')),
                "objectives": [
                    str(row.get('OBJETIVO 1', '')),
                    str(row.get('OBJETIVO 2', '')),
                    str(row.get('OBJETIVO 3', ''))
                ],
                "pdfUrl": f"/pdfs/{row.get('CÓDIGO', 'unknown')}.pdf"
            }
            
            # Limpiar objetivos vacíos y "nan"
            ejercicio["objectives"] = [obj for obj in ejercicio["objectives"] if obj != 'nan' and obj.strip()]
            
            data.append(ejercicio)

        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        print(f"¡EUREKA! Se han procesado {len(data)} ejercicios correctamente.")

    except Exception as e:
        print(f"Error crítico: {e}")

# Ejecutar
convertir_a_json('ejercicios.csv', '../src/data/exercises.json')
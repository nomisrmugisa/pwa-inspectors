import pandas as pd
import json

def generate_filters(csv_file, clinic_columns, output_file="facilityServiceFilters.js"):
    # Load CSV
    df = pd.read_csv(csv_file)

    # First column contains sections and field questions
    sections_and_fields = df.iloc[:, 0].tolist()

    facilityServiceFilters = {}

    for clinic in clinic_columns:
        if clinic not in df.columns:
            print(f"⚠️ Column '{clinic}' not found in CSV, skipping.")
            continue

        facilityServiceFilters[clinic] = {}
        current_section = None

        for i, field in enumerate(sections_and_fields):
            if pd.isna(field):
                continue

            cell_value = str(df[clinic].iloc[i]).strip()

            # Section headers contain "Inspection"
            if "Inspection" in str(field):
                current_section = field.strip()
                facilityServiceFilters[clinic][current_section] = {"showOnly": []}
            else:
                # Keep only rows where column has "?"
                if current_section and cell_value == "?":
                    facilityServiceFilters[clinic][current_section]["showOnly"].append(field.strip())

    # Save to JS file
    js_content = (
        "const facilityServiceFilters = "
        + json.dumps(facilityServiceFilters, indent=2)
        + ";\n\nexport default facilityServiceFilters;"
    )

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"✅ File saved: {output_file}")

# Run the function with the CSV file
if __name__ == "__main__":
    csv_file = "src/config/checklist for facilities2.0.csv"
    
    # Define clinic columns (you may need to adjust these based on your CSV)
    clinic_columns = [
        "Gynae Clinics",
        "Laboratory", 
        "Clinic",
        "General Practice",
        "Dental Clinic",
        "Eye Clinic",
        "ENT Clinic",
        "Mental Health Clinic",
        "Physiotherapy Clinic"
    ]
    
    try:
        generate_filters(csv_file, clinic_columns, "src/config/facilityServiceFilters.js")
        print("🎉 Facility service filters generated successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
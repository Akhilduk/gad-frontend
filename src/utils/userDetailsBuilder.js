/* ============================
   Shared Helpers
============================ */

import { remove } from "jszip";

const formatDate = (value) => {
    if (!value) return null
    const date = new Date(value)
    if (isNaN(date.getTime())) return null

    return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`
};

const formatLabel = (key) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ============================
   Core Card Builder
============================ */

const removeEmptyFields = (obj) =>
    Object.fromEntries(
        Object.entries(obj).filter(
            ([_, value]) =>
                value !== null &&
                value !== undefined &&
                value !== "N/A"
        )
    );

const removeUnwantedFields = (item) => {
    const cleaned = {}

    Object.entries(item).forEach(([key, value]) => {
        if (
            !value ||
            value === "N/A" ||
            (typeof value === "string" && value.trim() === "") ||
            [
                "documentId",
                "documentIds",
                "death_certificate",
                "marriage_certificate_proof",
                "sup_doc_for_remv",
                "is_alive",
                "death_date",
                "divorce_date",
                "parent_name",
                "is_from_history"
            ].includes(key)
        ) {
            return
        }

        // keep value as-is (NO formatting, NO label change)
        cleaned[key] = value
    })

    return cleaned
}

const cleanAddressSection = (addresses = []) =>
    addresses
        .filter(a => a?.title && a?.value)
        .map(a => ({
            ...a,
            title: a.title,
            value: a.value
        }));

/* ============================
   Dependents Builder
============================ */

const cleanDependentSection = (item) => {
    const fields = {}

    fields["relation"] = item.relation
    fields["name"] = item.name
    fields["gender"] = item.gender

    if (item.email) fields["email"] = item.email
    if (item.mobile_number) fields["mobile"] = item.mobile_number
    if (item.ais_officer) fields["ais_officer"] = item.ais_officer
    if (item.government_servant) fields["government_servant"] = item.government_servant
    if (item.institution) fields["institution"] = item.institution
    if (item.occupation) fields["occupation"] = item.occupation

    if (item.death_date) {
        fields["status"] = "Deceased"
        fields["date_of_death"] = formatDate(item.death_date)
    }
    const isSpouse = item.relation?.toLowerCase().includes("spouse")

    if (isSpouse) {
        if (item.divorce_date) {
            fields["status"] = "Divorced"
            fields["date_of_divorce"] = formatDate(item.divorce_date)
        } else {
            fields["status"] = "Current"
        }
    }

    if (item.parent_name) {
        fields["parent_name"] = item.parent_name
    }

    if (item.is_from_history) {
        fields["type"] = "Previous Relationship"
    }

    // const documents = [
    //     item.death_certificate,
    //     item.marriage_certificate_proof,
    //     item.sup_doc_for_remv
    // ].filter(Boolean)

    return removeEmptyFields(fields)
}

/* ============================
   Main Builder
============================ */

export const buildUserDetailsForDisplay = (raw) => {
    if (!raw) return {}

    return {
        full_name: raw.full_name,
        position: raw.position,
        profile_image: raw.profile_image,
        personal_details: raw.personal_details,

        address_details: cleanAddressSection(raw.address_details),

        dependent_details:
            raw.dependent_details?.map(cleanDependentSection) || [],

        educational_qualifications:
            raw.educational_qualifications?.map((item) =>
                removeUnwantedFields(item)
            ) || [],

        central_deputation:
            raw.central_deputation?.map((item) =>
                removeUnwantedFields(item)
            ) || [],
        
        service_details:
            raw.service_details?.map((item) =>
                removeUnwantedFields(item)
            ) || [],

        training_details:
            raw.training_details?.map((item) =>
                removeUnwantedFields(item)
            ) || [],

        awards_and_publications:
            raw.awards_and_publications?.map((item) =>
                removeUnwantedFields(item)
            ) || [],

        disability_details:
            raw.disability_details?.map((item) =>
                removeUnwantedFields(item)
            ) || [],

        disciplinary_details:
            raw.disciplinary_details?.map((item) => 
            removeUnwantedFields(item)) || []
    }
}

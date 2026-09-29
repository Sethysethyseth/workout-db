import { useParams } from "react-router-dom";
import { BlockBuilder } from "../components/blocks/builder/BlockBuilder.jsx";

export function EditBlockTemplatePage() {
  const { id } = useParams();
  const templateId = Number(id);

  return <BlockBuilder mode="edit" templateId={templateId} />;
}

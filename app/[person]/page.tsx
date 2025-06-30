export default function Person({ params }: { params: { person: string } }) {
  return <div>this is a page for {params.person}</div>
}

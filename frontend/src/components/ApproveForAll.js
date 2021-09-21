import React from "react";

export function ApproveForAll({ approveCaretaker, doDaily, tokenIds, address }) {
  const style = {
    display: "block",
    margin: "10px 0 0",
  }
  const listItems = tokenIds.map((id) =>
    <label for={id} style={style}><input type="checkbox" name="tokenId" value={id} id={id} defaultChecked="true" /> {id}</label >);
  return (
    <div>
      <h4>ApproveForAll</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();
          let caller = event.srcElement;
          console.log("Caller", caller);
          console.log(Object(event).keys);

          const formData = new FormData(event.target);
          const caretaker = formData.get("caretaker");

          const checkboxes = document.querySelectorAll('input[name="tokenId"]:checked');
          let approveTokens = [];
          checkboxes.forEach((checkbox) => {
            console.log(Object.keys(checkbox));
            approveTokens.push(checkbox.value);
          });
          console.log(approveTokens);

          if (caretaker) {
            approveCaretaker(caretaker, approveTokens);
          }
        }}
      >
        <div className="form-group">
          <label>Token IDs</label>
          <ul>{listItems}</ul>
        </div>
        <div className="form-group">
          <label>Approve caretaker for all</label>
          <input className="form-control" type="text" name="caretaker" value={address} required />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" name="approve" value="Approve Caretaker" default />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="button" name="dodaily" value="Do Daily"
            onClick={(event) => {
              const checkboxes = document.querySelectorAll('input[name="tokenId"]:checked');
              let approveTokens = [];
              checkboxes.forEach((checkbox) => {
                console.log(Object.keys(checkbox));
                approveTokens.push(checkbox.value);
              });
              doDaily(approveTokens);
            }
            } />
        </div>
      </form>

    </div>
  );
}

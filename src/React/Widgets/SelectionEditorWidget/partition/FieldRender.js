import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';
import LegendIcon from '../LegendIcon';

export default function render(props) {
  return (
    <table
      className={[
        props.depth ? style.table : style.rootTable,
        props.className,
      ].join(' ')}
    >
      <tbody>
        <tr>
          <td className={style.operationCell} title={props.fieldName}>
            <LegendIcon
              width="25px"
              height="25px"
              getLegend={props.getLegend}
              name={props.fieldName}
            />
          </td>
          <td className={style.groupTableCell} />
          <td>
            <table className={style.table}>
              <tbody>
                {React.Children.map(props.children, (r, idx) => (
                  <tr key={idx}>
                    <td className={style.tableCell}>{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

render.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
  getLegend: PropTypes.func,
  fieldName: PropTypes.string,
  depth: PropTypes.number,
  className: PropTypes.string,
};

render.defaultProps = {
  children: undefined,
  getLegend: undefined,
  fieldName: undefined,
  depth: undefined,
  className: undefined,
};

import {
  ExportDeclaration,
  StringLiteral,
  SyntaxKind,
} from 'typescript';

import { normalizePath } from '../utils';
import Statement, { StatementArgs } from './Statement';
import { NameBinding } from './types';

export default class ExportNode extends Statement {
  private readonly moduleIdentifier_?: string;
  names: NameBinding[];

  static fromDecl(node: ExportDeclaration, args: StatementArgs) {
    const { exportClause, moduleSpecifier } = node;
    if (!exportClause || exportClause.kind !== SyntaxKind.NamedExports) return undefined;
    const names: NameBinding[] = exportClause.elements
      .filter(e => e.kind === SyntaxKind.ExportSpecifier)
      .map(({ name, propertyName }) =>
        propertyName
          ? { aliasName: name.text, propertyName: propertyName.text }
          : { propertyName: name.text },
      );
    if (moduleSpecifier && moduleSpecifier.kind !== SyntaxKind.StringLiteral) return undefined;
    const moduleIdentifier = moduleSpecifier && (moduleSpecifier as StringLiteral).text;
    return new ExportNode(moduleIdentifier, names, args);
  }

  private constructor(
    moduleIdentifier: string | undefined,
    names: NameBinding[],
    args: StatementArgs,
  ) {
    super(args);
    this.moduleIdentifier_ = moduleIdentifier && normalizePath(moduleIdentifier);
    this.names = names;
  }

  merge(node: ExportNode) {
    if (this.moduleIdentifier_ !== node.moduleIdentifier_ || !this.canMergeComments(node))
      return false;
    this.names.concat(node.names);
    node.names = [];
    return this.mergeComments(node);
  }
}
